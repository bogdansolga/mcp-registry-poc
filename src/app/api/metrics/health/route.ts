import { and, isNotNull, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { requireBasicAuth } from "@/lib/auth/basic-auth";
import { db } from "@/lib/core/db";
import { mcpServers, serverHealthMetrics } from "@/lib/core/db/schema";

interface HealthMetricsResponse {
  total_servers: number;
  active_servers: number;
  inactive_servers: number;
  error_servers: number;
  avg_response_time_ms: number;
  p95_response_time_ms: number;
  p99_response_time_ms: number;
  uptime_percent: number;
  last_updated: string;
}

export async function GET(request: NextRequest) {
  const authError = requireBasicAuth(request);
  if (authError) return authError;

  try {
    // Get server counts by status
    const serverCounts = await db
      .select({
        status: mcpServers.status,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(mcpServers)
      .groupBy(mcpServers.status);

    // Parse server counts
    let totalServers = 0;
    let activeServers = 0;
    let inactiveServers = 0;
    let errorServers = 0;

    for (const row of serverCounts) {
      const count = row.count;
      totalServers += count;
      switch (row.status) {
        case "active":
          activeServers = count;
          break;
        case "inactive":
          inactiveServers = count;
          break;
        case "error":
          errorServers = count;
          break;
        default:
          // Unknown status - already counted in totalServers
          break;
      }
    }

    // Get response time statistics for last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const responseTimeStats = await db
      .select({
        avg_response_time: sql<number>`COALESCE(AVG(${serverHealthMetrics.responseTimeMs})::numeric, 0)`,
        p95_response_time: sql<number>`COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY ${serverHealthMetrics.responseTimeMs})::numeric, 0)`,
        p99_response_time: sql<number>`COALESCE(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY ${serverHealthMetrics.responseTimeMs})::numeric, 0)`,
      })
      .from(serverHealthMetrics)
      .where(
        and(
          sql`${serverHealthMetrics.checkedAt} >= ${twentyFourHoursAgo}`,
          isNotNull(serverHealthMetrics.responseTimeMs),
        ),
      );

    const avgResponseTime = Number(responseTimeStats[0]?.avg_response_time ?? 0);
    const p95ResponseTime = Number(responseTimeStats[0]?.p95_response_time ?? 0);
    const p99ResponseTime = Number(responseTimeStats[0]?.p99_response_time ?? 0);

    // Calculate uptime percentage (successful checks with status 200-299 / total checks)
    const uptimeStats = await db
      .select({
        total_checks: sql<number>`COUNT(*)::int`,
        successful_checks: sql<number>`COUNT(*) FILTER (WHERE ${serverHealthMetrics.statusCode} >= 200 AND ${serverHealthMetrics.statusCode} < 300)::int`,
      })
      .from(serverHealthMetrics)
      .where(sql`${serverHealthMetrics.checkedAt} >= ${twentyFourHoursAgo}`);

    const totalChecks = uptimeStats[0]?.total_checks ?? 0;
    const successfulChecks = uptimeStats[0]?.successful_checks ?? 0;
    const uptimePercent = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 100;

    const response: HealthMetricsResponse = {
      total_servers: totalServers,
      active_servers: activeServers,
      inactive_servers: inactiveServers,
      error_servers: errorServers,
      avg_response_time_ms: Math.round(avgResponseTime * 100) / 100,
      p95_response_time_ms: Math.round(p95ResponseTime * 100) / 100,
      p99_response_time_ms: Math.round(p99ResponseTime * 100) / 100,
      uptime_percent: Math.round(uptimePercent * 100) / 100,
      last_updated: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (_error) {
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
