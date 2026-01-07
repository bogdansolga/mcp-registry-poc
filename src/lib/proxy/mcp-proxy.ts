import { and, eq } from "drizzle-orm";
import { db } from "@/lib/core/db";
import { mcpServers, toolInvocations, tools } from "@/lib/core/db/schema";
import { logger } from "@/lib/core/utils/logger";

// ============================================================================
// TYPES
// ============================================================================

export interface ProxyRequest {
  serverId: number;
  toolName: string;
  arguments: Record<string, unknown>;
}

export interface ProxyResponse {
  success: boolean;
  result?: unknown;
  error?: string;
  durationMs: number;
}

export interface ProxyResult extends ProxyResponse {
  serverName?: string;
  toolName?: string;
  errorCode?: "SERVER_NOT_FOUND" | "TOOL_NOT_FOUND" | "INVOCATION_ERROR" | "VALIDATION_ERROR";
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_TIMEOUT_MS = 10000; // 10 seconds

// Common stdio transport indicators in endpoint URLs
const STDIO_INDICATORS = ["stdio://", "npx ", "node ", "python ", "uvx "];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Detects if the endpoint URL indicates a stdio transport
 */
function isStdioTransport(endpointUrl: string): boolean {
  const lowerUrl = endpointUrl.toLowerCase();
  return STDIO_INDICATORS.some((indicator) => lowerUrl.includes(indicator.toLowerCase()));
}

/**
 * Makes an HTTP request to an MCP server to invoke a tool
 */
async function invokeHttpTool(
  endpointUrl: string,
  toolName: string,
  args: Record<string, unknown>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<{ success: boolean; result?: unknown; error?: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Build the invoke URL
    const invokeUrl = `${endpointUrl.replace(/\/$/, "")}/invoke`;

    logger.debug(`Invoking tool ${toolName} at ${invokeUrl}`);

    const response = await fetch(invokeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tool_name: toolName,
        arguments: args,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    const result = await response.json();
    return {
      success: true,
      result,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return {
          success: false,
          error: `Request timeout after ${timeoutMs}ms`,
        };
      }
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Unknown error during invocation",
    };
  }
}

// ============================================================================
// MAIN PROXY FUNCTION
// ============================================================================

/**
 * Invokes a tool on a registered MCP server through the proxy.
 *
 * This function:
 * 1. Looks up the server from the database
 * 2. Validates the tool exists on the server
 * 3. Forwards the request to the MCP server's endpoint (if HTTP-based)
 * 4. Records the invocation in the toolInvocations table
 * 5. Returns the result
 */
export async function invokeToolProxy(request: ProxyRequest): Promise<ProxyResult> {
  const startTime = Date.now();

  logger.info(`Proxy invocation request: server=${request.serverId}, tool=${request.toolName}`);

  try {
    // 1. Look up the server
    const [server] = await db.select().from(mcpServers).where(eq(mcpServers.id, request.serverId));

    if (!server) {
      logger.warn(`Server not found: ${request.serverId}`);
      return {
        success: false,
        error: "Server not found",
        errorCode: "SERVER_NOT_FOUND",
        durationMs: Date.now() - startTime,
      };
    }

    // 2. Validate the tool exists on the server
    const [tool] = await db
      .select()
      .from(tools)
      .where(and(eq(tools.serverId, request.serverId), eq(tools.name, request.toolName)));

    if (!tool) {
      logger.warn(`Tool not found: ${request.toolName} on server ${server.name}`);
      return {
        success: false,
        error: `Tool '${request.toolName}' not found on server '${server.name}'`,
        errorCode: "TOOL_NOT_FOUND",
        serverName: server.name,
        durationMs: Date.now() - startTime,
      };
    }

    // 3. Check if this is a stdio-based server
    if (isStdioTransport(server.endpointUrl)) {
      logger.info(`Server ${server.name} uses stdio transport, cannot proxy`);

      // Record the invocation attempt (as failed due to transport type)
      await recordInvocation(server.id, tool.id, Date.now() - startTime, false);

      return {
        success: false,
        error: `Server '${server.name}' uses stdio transport and cannot be invoked via HTTP proxy. Connect directly using stdio transport.`,
        errorCode: "INVOCATION_ERROR",
        serverName: server.name,
        toolName: tool.name,
        durationMs: Date.now() - startTime,
      };
    }

    // 4. Forward the request to the MCP server
    const invocationResult = await invokeHttpTool(server.endpointUrl, request.toolName, request.arguments);

    const durationMs = Date.now() - startTime;

    // 5. Record the invocation
    await recordInvocation(server.id, tool.id, durationMs, invocationResult.success);

    if (!invocationResult.success) {
      logger.warn(`Tool invocation failed: ${invocationResult.error}`);
      return {
        success: false,
        error: invocationResult.error,
        errorCode: "INVOCATION_ERROR",
        serverName: server.name,
        toolName: tool.name,
        durationMs,
      };
    }

    logger.info(`Tool invocation succeeded: ${server.name}/${tool.name} in ${durationMs}ms`);

    return {
      success: true,
      result: invocationResult.result,
      serverName: server.name,
      toolName: tool.name,
      durationMs,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    logger.error(`Proxy invocation error: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
      errorCode: "INVOCATION_ERROR",
      durationMs,
    };
  }
}

/**
 * Records a tool invocation in the metrics database
 */
async function recordInvocation(serverId: number, toolId: number, durationMs: number, success: boolean): Promise<void> {
  try {
    await db.insert(toolInvocations).values({
      serverId,
      toolId,
      durationMs,
      success,
    });
    logger.debug(`Recorded invocation: server=${serverId}, tool=${toolId}, success=${success}`);
  } catch (error) {
    // Don't fail the main operation if we can't record metrics
    logger.error("Failed to record tool invocation:", error);
  }
}
