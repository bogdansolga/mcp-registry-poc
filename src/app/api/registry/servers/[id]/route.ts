import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { requireBasicAuth } from "@/lib/auth/basic-auth";
import { db } from "@/lib/core/db";
import { mcpServers, serverMetadata, tools } from "@/lib/core/db/schema";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireBasicAuth(request);
  if (authError) return authError;

  const serverId = parseInt(params.id, 10);
  if (Number.isNaN(serverId)) {
    return NextResponse.json({ error: "Invalid server ID", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  try {
    // Get server
    const [server] = await db.select().from(mcpServers).where(eq(mcpServers.id, serverId));

    if (!server) {
      return NextResponse.json({ error: "Server not found", code: "SERVER_NOT_FOUND" }, { status: 404 });
    }

    // Get metadata
    const [metadata] = await db.select().from(serverMetadata).where(eq(serverMetadata.serverId, serverId));

    // Get tools
    const serverTools = await db.select().from(tools).where(eq(tools.serverId, serverId));

    return NextResponse.json({
      ...server,
      metadata: metadata || null,
      tools: serverTools,
    });
  } catch (_error) {
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
