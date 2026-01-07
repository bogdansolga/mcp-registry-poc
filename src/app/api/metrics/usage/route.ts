import { desc, eq, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { requireBasicAuth } from "@/lib/auth/basic-auth";
import { db } from "@/lib/core/db";
import { mcpServers, toolInvocations, tools } from "@/lib/core/db/schema";

interface TopTool {
  tool_id: number;
  tool_name: string;
  server_name: string;
  invocation_count: number;
  avg_duration_ms: number;
}

interface InvocationBucket {
  timestamp: string;
  count: number;
}

interface UsageMetricsResponse {
  total_invocations: number;
  success_rate: number;
  top_tools: TopTool[];
  invocations_over_time: InvocationBucket[];
}

type Period = "24h" | "7d" | "30d";

function getPeriodStart(period: Period): Date {
  const now = Date.now();
  switch (period) {
    case "24h":
      return new Date(now - 24 * 60 * 60 * 1000);
    case "7d":
      return new Date(now - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now - 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now - 24 * 60 * 60 * 1000);
  }
}

export async function GET(request: NextRequest) {
  const authError = requireBasicAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const periodParam = searchParams.get("period") || "24h";

  // Validate period
  if (!["24h", "7d", "30d"].includes(periodParam)) {
    return NextResponse.json(
      { error: "Invalid period. Must be one of: 24h, 7d, 30d", code: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }

  const period = periodParam as Period;
  const periodStart = getPeriodStart(period);

  try {
    // Get total invocations and success rate
    const invocationStats = await db
      .select({
        total: sql<number>`COUNT(*)::int`,
        successful: sql<number>`COUNT(*) FILTER (WHERE ${toolInvocations.success} = true)::int`,
      })
      .from(toolInvocations)
      .where(sql`${toolInvocations.invokedAt} >= ${periodStart}`);

    const totalInvocations = invocationStats[0]?.total ?? 0;
    const successfulInvocations = invocationStats[0]?.successful ?? 0;
    const successRate = totalInvocations > 0 ? (successfulInvocations / totalInvocations) * 100 : 100;

    // Get top 10 tools by invocation count
    const topToolsResult = await db
      .select({
        tool_id: tools.id,
        tool_name: tools.name,
        server_name: mcpServers.name,
        invocation_count: sql<number>`COUNT(${toolInvocations.id})::int`,
        avg_duration_ms: sql<number>`COALESCE(AVG(${toolInvocations.durationMs})::numeric, 0)`,
      })
      .from(toolInvocations)
      .innerJoin(tools, eq(toolInvocations.toolId, tools.id))
      .innerJoin(mcpServers, eq(toolInvocations.serverId, mcpServers.id))
      .where(sql`${toolInvocations.invokedAt} >= ${periodStart}`)
      .groupBy(tools.id, tools.name, mcpServers.name)
      .orderBy(desc(sql`COUNT(${toolInvocations.id})`))
      .limit(10);

    const topTools: TopTool[] = topToolsResult.map((row) => ({
      tool_id: row.tool_id,
      tool_name: row.tool_name,
      server_name: row.server_name,
      invocation_count: row.invocation_count,
      avg_duration_ms: Math.round(Number(row.avg_duration_ms) * 100) / 100,
    }));

    // Get invocations over time (hourly buckets)
    const invocationsOverTime = await db
      .select({
        bucket: sql<string>`DATE_TRUNC('hour', ${toolInvocations.invokedAt})`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(toolInvocations)
      .where(sql`${toolInvocations.invokedAt} >= ${periodStart}`)
      .groupBy(sql`DATE_TRUNC('hour', ${toolInvocations.invokedAt})`)
      .orderBy(sql`DATE_TRUNC('hour', ${toolInvocations.invokedAt})`);

    const invocationBuckets: InvocationBucket[] = invocationsOverTime.map((row) => ({
      timestamp: new Date(row.bucket).toISOString(),
      count: row.count,
    }));

    const response: UsageMetricsResponse = {
      total_invocations: totalInvocations,
      success_rate: Math.round(successRate * 100) / 100,
      top_tools: topTools,
      invocations_over_time: invocationBuckets,
    };

    return NextResponse.json(response);
  } catch (_error) {
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
