import { and, eq, type SQL, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { createAuthCookieHeader, requireBasicAuthWithCookie } from "@/lib/auth/basic-auth";
import { db } from "@/lib/core/db";
import { mcpServers, tools } from "@/lib/core/db/schema";

export async function GET(request: NextRequest) {
  const { error: authError, setCookie } = requireBasicAuthWithCookie(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const search = searchParams.get("search");

  try {
    // Build where clause
    const conditions: SQL[] = [];
    if (status) conditions.push(eq(mcpServers.status, status as "active" | "inactive" | "error"));
    if (type) conditions.push(eq(mcpServers.serverType, type as "official" | "community" | "mock"));
    if (search) {
      conditions.push(
        sql`(${mcpServers.name} ILIKE ${`%${search}%`} OR ${mcpServers.displayName} ILIKE ${`%${search}%`})`,
      );
    }

    // Query with tool count
    const servers = await db
      .select({
        id: mcpServers.id,
        name: mcpServers.name,
        display_name: mcpServers.displayName,
        server_type: mcpServers.serverType,
        status: mcpServers.status,
        version: mcpServers.version,
        last_health_check: mcpServers.lastHealthCheck,
        tools_count: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${tools}
          WHERE ${tools.serverId} = ${mcpServers.id}
        )`,
      })
      .from(mcpServers)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(mcpServers.createdAt);

    const response = NextResponse.json({
      servers,
      total: servers.length,
    });

    if (setCookie) {
      response.headers.set("Set-Cookie", createAuthCookieHeader());
    }

    return response;
  } catch (_error) {
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
