import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { requireBasicAuth } from "@/lib/auth/basic-auth";
import { db } from "@/lib/core/db";
import { mcpServers, serverHealthMetrics, toolInvocations } from "@/lib/core/db/schema";

interface ResponseTimeEntry {
  timestamp: string;
  response_time_ms: number;
}

interface ErrorLogEntry {
  timestamp: string;
  error_message: string | null;
  status_code: number | null;
}

interface ServerStatsResponse {
  server_id: number;
  uptime_percent: number;
  avg_response_time_ms: number;
  error_count: number;
  total_invocations: number;
  response_times: ResponseTimeEntry[];
  error_log: ErrorLogEntry[];
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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = requireBasicAuth(request);
  if (authError) return authError;

  const { id } = await params;
  const serverId = parseInt(id, 10);

  if (Number.isNaN(serverId)) {
    return NextResponse.json({ error: "Invalid server ID", code: "VALIDATION_ERROR" }, { status: 400 });
  }

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
    // Verify server exists
    const [server] = await db.select({ id: mcpServers.id }).from(mcpServers).where(eq(mcpServers.id, serverId));

    if (!server) {
      return NextResponse.json({ error: "Server not found", code: "SERVER_NOT_FOUND" }, { status: 404 });
    }

    // Calculate uptime percentage and avg response time
    const healthStats = await db
      .select({
        total_checks: sql<number>`COUNT(*)::int`,
        successful_checks: sql<number>`COUNT(*) FILTER (WHERE ${serverHealthMetrics.statusCode} >= 200 AND ${serverHealthMetrics.statusCode} < 300)::int`,
        avg_response_time: sql<number>`COALESCE(AVG(${serverHealthMetrics.responseTimeMs})::numeric, 0)`,
      })
      .from(serverHealthMetrics)
      .where(and(eq(serverHealthMetrics.serverId, serverId), sql`${serverHealthMetrics.checkedAt} >= ${periodStart}`));

    const totalChecks = healthStats[0]?.total_checks ?? 0;
    const successfulChecks = healthStats[0]?.successful_checks ?? 0;
    const uptimePercent = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 100;
    const avgResponseTime = Number(healthStats[0]?.avg_response_time ?? 0);

    // Get error count (non-2xx status codes or null status codes with error messages)
    const errorCountResult = await db
      .select({
        count: sql<number>`COUNT(*)::int`,
      })
      .from(serverHealthMetrics)
      .where(
        and(
          eq(serverHealthMetrics.serverId, serverId),
          sql`${serverHealthMetrics.checkedAt} >= ${periodStart}`,
          sql`(${serverHealthMetrics.statusCode} < 200 OR ${serverHealthMetrics.statusCode} >= 300 OR ${serverHealthMetrics.errorMessage} IS NOT NULL)`,
        ),
      );

    const errorCount = errorCountResult[0]?.count ?? 0;

    // Get total invocations
    const invocationCountResult = await db
      .select({
        count: sql<number>`COUNT(*)::int`,
      })
      .from(toolInvocations)
      .where(and(eq(toolInvocations.serverId, serverId), sql`${toolInvocations.invokedAt} >= ${periodStart}`));

    const totalInvocations = invocationCountResult[0]?.count ?? 0;

    // Get response times over time (last 100 records)
    const responseTimesResult = await db
      .select({
        timestamp: serverHealthMetrics.checkedAt,
        response_time_ms: serverHealthMetrics.responseTimeMs,
      })
      .from(serverHealthMetrics)
      .where(
        and(
          eq(serverHealthMetrics.serverId, serverId),
          sql`${serverHealthMetrics.checkedAt} >= ${periodStart}`,
          isNotNull(serverHealthMetrics.responseTimeMs),
        ),
      )
      .orderBy(desc(serverHealthMetrics.checkedAt))
      .limit(100);

    const responseTimes: ResponseTimeEntry[] = responseTimesResult.map((row) => ({
      timestamp: row.timestamp.toISOString(),
      response_time_ms: row.response_time_ms!,
    }));

    // Get error log (last 20 errors)
    const errorLogResult = await db
      .select({
        timestamp: serverHealthMetrics.checkedAt,
        error_message: serverHealthMetrics.errorMessage,
        status_code: serverHealthMetrics.statusCode,
      })
      .from(serverHealthMetrics)
      .where(
        and(
          eq(serverHealthMetrics.serverId, serverId),
          sql`${serverHealthMetrics.checkedAt} >= ${periodStart}`,
          sql`(${serverHealthMetrics.statusCode} < 200 OR ${serverHealthMetrics.statusCode} >= 300 OR ${serverHealthMetrics.errorMessage} IS NOT NULL)`,
        ),
      )
      .orderBy(desc(serverHealthMetrics.checkedAt))
      .limit(20);

    const errorLog: ErrorLogEntry[] = errorLogResult.map((row) => ({
      timestamp: row.timestamp.toISOString(),
      error_message: row.error_message,
      status_code: row.status_code,
    }));

    const response: ServerStatsResponse = {
      server_id: serverId,
      uptime_percent: Math.round(uptimePercent * 100) / 100,
      avg_response_time_ms: Math.round(avgResponseTime * 100) / 100,
      error_count: errorCount,
      total_invocations: totalInvocations,
      response_times: responseTimes,
      error_log: errorLog,
    };

    return NextResponse.json(response);
  } catch (_error) {
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
