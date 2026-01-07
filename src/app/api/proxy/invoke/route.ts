import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireBasicAuth } from "@/lib/auth/basic-auth";
import { invokeToolProxy } from "@/lib/proxy/mcp-proxy";

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

const InvokeRequestSchema = z.object({
  server_id: z.number().int().positive(),
  tool_name: z.string().min(1).max(255),
  arguments: z.record(z.string(), z.unknown()).default({}),
});

// ============================================================================
// POST /api/proxy/invoke
// ============================================================================

export async function POST(request: NextRequest) {
  // Authenticate
  const authError = requireBasicAuth(request);
  if (authError) return authError;

  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid JSON in request body",
        code: "VALIDATION_ERROR",
      },
      { status: 400 },
    );
  }

  // Validate request
  const result = InvokeRequestSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: result.error.issues,
      },
      { status: 400 },
    );
  }

  const { server_id, tool_name, arguments: toolArguments } = result.data;

  // Invoke the tool through the proxy
  const proxyResult = await invokeToolProxy({
    serverId: server_id,
    toolName: tool_name,
    arguments: toolArguments,
  });

  // Handle different error cases
  if (!proxyResult.success) {
    const statusCode = getStatusCode(proxyResult.errorCode);
    return NextResponse.json(
      {
        success: false,
        error: proxyResult.error,
        code: proxyResult.errorCode,
      },
      { status: statusCode },
    );
  }

  // Success response
  return NextResponse.json({
    success: true,
    result: proxyResult.result,
    duration_ms: proxyResult.durationMs,
    server_name: proxyResult.serverName,
    tool_name: proxyResult.toolName,
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getStatusCode(
  errorCode?: "SERVER_NOT_FOUND" | "TOOL_NOT_FOUND" | "INVOCATION_ERROR" | "VALIDATION_ERROR",
): number {
  switch (errorCode) {
    case "SERVER_NOT_FOUND":
      return 404;
    case "TOOL_NOT_FOUND":
      return 404;
    case "VALIDATION_ERROR":
      return 400;
    case "INVOCATION_ERROR":
      return 502; // Bad Gateway - upstream server error
    default:
      return 500;
  }
}
