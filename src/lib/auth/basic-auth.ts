import { type NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE_NAME = "mcp_registry_auth";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

function createAuthCookie(): string {
  // Simple token: base64 encoded timestamp + secret
  return Buffer.from(`authenticated:${Date.now()}`).toString("base64");
}

function isValidAuthCookie(cookieValue: string): boolean {
  try {
    const decoded = Buffer.from(cookieValue, "base64").toString("utf-8");
    return decoded.startsWith("authenticated:");
  } catch {
    return false;
  }
}

export function requireBasicAuth(request: NextRequest): NextResponse | null {
  // Check for auth cookie first
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME);
  if (authCookie && isValidAuthCookie(authCookie.value)) {
    return null; // Cookie auth successful
  }

  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Basic ")) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401, headers: { "WWW-Authenticate": 'Basic realm="MCP Registry"' } },
    );
  }

  const credentials = Buffer.from(authHeader.slice(6), "base64").toString("utf-8");
  const [username, password] = credentials.split(":");

  const validUsername = process.env.REGISTRY_USERNAME;
  const validPassword = process.env.REGISTRY_PASSWORD;

  if (!validUsername || !validPassword) {
    console.error("REGISTRY_USERNAME or REGISTRY_PASSWORD not set");
    return NextResponse.json({ error: "Server configuration error", code: "INTERNAL_ERROR" }, { status: 500 });
  }

  if (username !== validUsername || password !== validPassword) {
    return NextResponse.json(
      { error: "Invalid credentials", code: "UNAUTHORIZED" },
      { status: 401, headers: { "WWW-Authenticate": 'Basic realm="MCP Registry"' } },
    );
  }

  return null; // Auth successful
}

// Use this wrapper to set auth cookie on successful Basic Auth
export function requireBasicAuthWithCookie(request: NextRequest): { error: NextResponse | null; setCookie: boolean } {
  // Check for auth cookie first
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME);
  if (authCookie && isValidAuthCookie(authCookie.value)) {
    return { error: null, setCookie: false };
  }

  const authError = requireBasicAuth(request);
  if (authError) {
    return { error: authError, setCookie: false };
  }

  // Basic Auth succeeded, signal to set cookie
  return { error: null, setCookie: true };
}

export function createAuthCookieHeader(): string {
  const token = createAuthCookie();
  return `${AUTH_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`;
}
