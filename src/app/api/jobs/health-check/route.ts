import { type NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/core/utils/logger";
import { runHealthChecks } from "@/lib/jobs/health-check";

/**
 * Health Check Cron Endpoint
 *
 * POST /api/jobs/health-check
 *
 * Allows manual triggering of health checks.
 * Useful for external cron services like Vercel Cron or GitHub Actions.
 *
 * Optional: Validate cron secret via x-cron-secret header
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Optional: Validate cron secret if configured
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const requestSecret = request.headers.get("x-cron-secret");
      if (requestSecret !== cronSecret) {
        logger.warn("Unauthorized health check cron request - invalid secret");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    logger.info("Manual health check triggered via cron endpoint");

    // Run health checks
    await runHealthChecks();

    return NextResponse.json({
      success: true,
      message: "Health checks completed successfully",
    });
  } catch (error) {
    logger.error("Error in health check cron endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
