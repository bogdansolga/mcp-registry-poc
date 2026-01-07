import { ilike, or, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { requireBasicAuth } from "@/lib/auth/basic-auth";
import { db } from "@/lib/core/db";
import { mcpServers, tools } from "@/lib/core/db/schema";

export async function GET(request: NextRequest) {
  const authError = requireBasicAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required and must be at least 2 characters", code: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }

  try {
    const searchPattern = `%${query}%`;

    // Search servers by name, displayName, description
    const serverResults = await db
      .select({
        id: mcpServers.id,
        name: mcpServers.name,
        display_name: mcpServers.displayName,
        description: mcpServers.description,
        server_type: mcpServers.serverType,
        status: mcpServers.status,
      })
      .from(mcpServers)
      .where(
        or(
          ilike(mcpServers.name, searchPattern),
          ilike(mcpServers.displayName, searchPattern),
          ilike(mcpServers.description, searchPattern),
        ),
      )
      .limit(20);

    // Search tools by name, description, category with server info
    const toolResults = await db
      .select({
        tool_id: tools.id,
        tool_name: tools.name,
        tool_description: tools.description,
        tool_category: tools.category,
        server_id: tools.serverId,
        server_name: mcpServers.name,
      })
      .from(tools)
      .innerJoin(mcpServers, sql`${tools.serverId} = ${mcpServers.id}`)
      .where(
        or(
          ilike(tools.name, searchPattern),
          ilike(tools.description, searchPattern),
          ilike(tools.category, searchPattern),
        ),
      )
      .limit(20);

    return NextResponse.json({
      query,
      servers: serverResults,
      tools: toolResults,
      total_results: serverResults.length + toolResults.length,
    });
  } catch (_error) {
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
