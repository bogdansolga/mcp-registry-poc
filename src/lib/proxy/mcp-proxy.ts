import { and, eq } from "drizzle-orm";
import { decrypt } from "@/lib/auth/encryption";
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

/**
 * Authentication parameters for HTTP requests to MCP servers
 */
export interface AuthParams {
  type: "none" | "basic" | "bearer" | "api_key";
  username?: string;
  password?: string;
  token?: string;
}

// ============================================================================
// JSON-RPC 2.0 TYPES
// ============================================================================

/**
 * JSON-RPC 2.0 request structure for MCP protocol
 */
interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

/**
 * JSON-RPC 2.0 error object
 */
interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

/**
 * MCP content block returned in tool results
 */
interface McpContentBlock {
  type: string;
  text?: string;
  data?: unknown;
  mimeType?: string;
}

/**
 * MCP tool result structure
 */
interface McpToolResult {
  content?: McpContentBlock[];
  isError?: boolean;
}

/**
 * JSON-RPC 2.0 response structure
 */
interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number | null;
  result?: McpToolResult;
  error?: JsonRpcError;
}

/**
 * Transport type for MCP servers
 */
type TransportType = "http" | "sse" | "stdio";

/**
 * Result from transport invoke operation
 */
interface TransportResult {
  success: boolean;
  result?: unknown;
  error?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_TIMEOUT_MS = 10000; // 10 seconds

// Common stdio transport indicators in endpoint URLs
const STDIO_INDICATORS = ["stdio://", "npx ", "node ", "python ", "uvx "];

// SSE transport indicator in endpoint URLs
const SSE_INDICATOR = "/sse";

// Request ID counter for JSON-RPC requests
let jsonRpcIdCounter = 0;

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
 * Detects if the endpoint URL indicates an SSE transport
 */
function isSseTransport(endpointUrl: string): boolean {
  return endpointUrl.toLowerCase().includes(SSE_INDICATOR);
}

/**
 * Detects the transport type from an endpoint URL
 */
function detectTransport(endpointUrl: string): TransportType {
  if (isStdioTransport(endpointUrl)) {
    return "stdio";
  }
  if (isSseTransport(endpointUrl)) {
    return "sse";
  }
  return "http";
}

/**
 * Generates a unique ID for JSON-RPC requests
 */
function nextJsonRpcId(): number {
  return ++jsonRpcIdCounter;
}

/**
 * Creates a JSON-RPC 2.0 request for MCP tools/call method
 */
function createToolsCallRequest(toolName: string, args: Record<string, unknown>): JsonRpcRequest {
  return {
    jsonrpc: "2.0",
    id: nextJsonRpcId(),
    method: "tools/call",
    params: {
      name: toolName,
      arguments: args,
    },
  };
}

/**
 * Parses a JSON-RPC 2.0 response and extracts the result or error
 */
function parseJsonRpcResponse(response: JsonRpcResponse): TransportResult {
  // Check for top-level JSON-RPC error
  if (response.error) {
    return {
      success: false,
      error: `JSON-RPC error ${response.error.code}: ${response.error.message}`,
    };
  }

  // Check for MCP-level error in result
  if (response.result?.isError) {
    const errorContent = response.result.content?.[0];
    const errorMessage = errorContent?.text || "Tool execution failed";
    return {
      success: false,
      error: errorMessage,
    };
  }

  // Success - extract content from result
  const content = response.result?.content;
  if (content && content.length > 0) {
    // If single text content, extract just the text
    if (content.length === 1 && content[0].type === "text" && content[0].text) {
      return {
        success: true,
        result: content[0].text,
      };
    }
    // Otherwise return the full content array
    return {
      success: true,
      result: content,
    };
  }

  // No content in result
  return {
    success: true,
    result: response.result,
  };
}

/**
 * Builds authentication headers based on auth type
 */
function buildAuthHeaders(auth: AuthParams): Record<string, string> {
  const headers: Record<string, string> = {};

  switch (auth.type) {
    case "basic": {
      if (auth.username && auth.password) {
        const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString("base64");
        headers["Authorization"] = `Basic ${credentials}`;
      }
      break;
    }
    case "bearer": {
      if (auth.token) {
        headers["Authorization"] = `Bearer ${auth.token}`;
      }
      break;
    }
    case "api_key": {
      if (auth.token) {
        headers["X-API-Key"] = auth.token;
      }
      break;
    }
    case "none":
    default:
      // No auth headers needed
      break;
  }

  return headers;
}

/**
 * Extracts and decrypts authentication credentials from a server record.
 * Returns undefined if no auth is configured, or the decrypted auth params.
 * Handles decryption errors gracefully by logging and returning undefined.
 */
function extractServerAuth(server: {
  authType: "none" | "basic" | "bearer" | "api_key" | null;
  authUsername: string | null;
  authPassword: string | null;
  authToken: string | null;
}): AuthParams | undefined {
  // No auth configured
  if (!server.authType || server.authType === "none") {
    return undefined;
  }

  try {
    switch (server.authType) {
      case "basic": {
        const password = server.authPassword ? decrypt(server.authPassword) : undefined;
        return {
          type: "basic",
          username: server.authUsername || undefined,
          password,
        };
      }
      case "bearer": {
        const token = server.authToken ? decrypt(server.authToken) : undefined;
        return {
          type: "bearer",
          token,
        };
      }
      case "api_key": {
        const token = server.authToken ? decrypt(server.authToken) : undefined;
        return {
          type: "api_key",
          token,
        };
      }
      default:
        return undefined;
    }
  } catch (error) {
    // Log the error but don't fail the request - proceed without auth
    logger.error(
      `Failed to decrypt credentials for server auth type ${server.authType}: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    return undefined;
  }
}

// ============================================================================
// TRANSPORT IMPLEMENTATIONS
// ============================================================================

/**
 * HTTP Transport for MCP servers using JSON-RPC 2.0 over HTTP POST.
 * Sends requests to the endpoint URL directly.
 */
async function invokeHttpTransport(
  endpointUrl: string,
  toolName: string,
  args: Record<string, unknown>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  auth?: AuthParams,
): Promise<TransportResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Create JSON-RPC request
    const jsonRpcRequest = createToolsCallRequest(toolName, args);

    logger.debug(`HTTP Transport: Invoking ${toolName} at ${endpointUrl}`);

    // Build headers with auth if provided
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (auth) {
      const authHeaders = buildAuthHeaders(auth);
      Object.assign(headers, authHeaders);
    }

    const response = await fetch(endpointUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(jsonRpcRequest),
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

    const jsonRpcResponse: JsonRpcResponse = await response.json();
    return parseJsonRpcResponse(jsonRpcResponse);
  } catch (error) {
    clearTimeout(timeoutId);
    return handleTransportError(error, timeoutMs);
  }
}

/**
 * SSE Transport for MCP servers using Server-Sent Events.
 * For POC: Attempts direct POST to SSE endpoint (works for Atlassian-style servers).
 * Full streaming SSE is not yet supported.
 */
async function invokeSseTransport(
  endpointUrl: string,
  toolName: string,
  args: Record<string, unknown>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  auth?: AuthParams,
): Promise<TransportResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Create JSON-RPC request
    const jsonRpcRequest = createToolsCallRequest(toolName, args);

    logger.debug(`SSE Transport: Invoking ${toolName} at ${endpointUrl}`);

    // Build headers with auth if provided
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    };

    if (auth) {
      const authHeaders = buildAuthHeaders(auth);
      Object.assign(headers, authHeaders);
    }

    // Attempt direct POST to SSE endpoint (works for many SSE servers)
    const response = await fetch(endpointUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(jsonRpcRequest),
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

    const contentType = response.headers.get("content-type") || "";

    // If server returns JSON, parse as JSON-RPC response
    if (contentType.includes("application/json")) {
      const jsonRpcResponse: JsonRpcResponse = await response.json();
      return parseJsonRpcResponse(jsonRpcResponse);
    }

    // If server returns SSE stream, we don't support streaming yet
    if (contentType.includes("text/event-stream")) {
      return {
        success: false,
        error: "Streaming SSE responses are not yet supported. Server returned event stream instead of JSON.",
      };
    }

    // For other content types, try to parse as JSON
    try {
      const jsonRpcResponse: JsonRpcResponse = await response.json();
      return parseJsonRpcResponse(jsonRpcResponse);
    } catch {
      const text = await response.text();
      return {
        success: true,
        result: text,
      };
    }
  } catch (error) {
    clearTimeout(timeoutId);
    return handleTransportError(error, timeoutMs);
  }
}

/**
 * Common error handling for transport operations
 */
function handleTransportError(error: unknown, timeoutMs: number): TransportResult {
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

/**
 * Invokes a tool using the appropriate transport based on endpoint URL.
 * Automatically detects HTTP vs SSE transport from URL patterns.
 */
function invokeWithTransport(
  endpointUrl: string,
  toolName: string,
  args: Record<string, unknown>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  auth?: AuthParams,
): Promise<TransportResult> {
  const transport = detectTransport(endpointUrl);

  switch (transport) {
    case "sse":
      return invokeSseTransport(endpointUrl, toolName, args, timeoutMs, auth);
    case "http":
      return invokeHttpTransport(endpointUrl, toolName, args, timeoutMs, auth);
    case "stdio":
      // This should be caught earlier, but handle it here as a safety net
      return Promise.resolve({
        success: false,
        error: "stdio transport cannot be proxied via HTTP",
      });
    default:
      return Promise.resolve({
        success: false,
        error: `Unknown transport type: ${transport}`,
      });
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
 * 3. Detects transport type and checks if it can be proxied
 * 4. Extracts and decrypts server credentials for authentication
 * 5. Forwards JSON-RPC 2.0 request using appropriate transport (HTTP/SSE)
 * 6. Records the invocation in the toolInvocations table
 * 7. Returns the result
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

    // 3. Detect transport type and check if it can be proxied
    const transportType = detectTransport(server.endpointUrl);
    logger.debug(`Detected transport type: ${transportType} for ${server.endpointUrl}`);

    if (transportType === "stdio") {
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

    // 4. Extract and decrypt server credentials for auth
    const auth = extractServerAuth(server);

    // 5. Forward JSON-RPC 2.0 request using appropriate transport
    const invocationResult = await invokeWithTransport(
      server.endpointUrl,
      request.toolName,
      request.arguments,
      DEFAULT_TIMEOUT_MS,
      auth,
    );

    const durationMs = Date.now() - startTime;

    // 6. Record the invocation
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
