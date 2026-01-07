import { eq, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { requireBasicAuth } from "@/lib/auth/basic-auth";
import { db } from "@/lib/core/db";
import { mcpServers, tools } from "@/lib/core/db/schema";

export async function GET(request: NextRequest, { params }: { params: Promise<{ category: string }> }) {
  const authError = requireBasicAuth(request);
  if (authError) return authError;

  const { category } = await params;
  const decodedCategory = decodeURIComponent(category);

  try {
    // Get tools by category with server info
    const toolResults = await db
      .select({
        id: tools.id,
        name: tools.name,
        description: tools.description,
        category: tools.category,
        server_id: tools.serverId,
        server_name: mcpServers.name,
        server_status: mcpServers.status,
      })
      .from(tools)
      .innerJoin(mcpServers, sql`${tools.serverId} = ${mcpServers.id}`)
      .where(eq(tools.category, decodedCategory));

    return NextResponse.json({
      category: decodedCategory,
      tools: toolResults,
      total: toolResults.length,
    });
  } catch (_error) {
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
