import { type NextRequest, NextResponse } from "next/server";

export function requireBasicAuth(request: NextRequest): NextResponse | null {
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
