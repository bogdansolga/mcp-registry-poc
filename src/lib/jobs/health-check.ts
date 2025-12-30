import { eq } from "drizzle-orm";
import { db } from "../core/db";
import { mcpServers, serverHealthMetrics } from "../core/db/schema";
import { logger } from "../core/utils/logger";

/**
 * Health Check Background Job
 *
 * Monitors all active MCP servers by:
 * - Querying all servers with status='active'
 * - Fetching ${server.endpointUrl}/health for each server
 * - Recording response time and status in server_health_metrics table
 * - Updating server's lastHealthCheck timestamp and status
 */

export async function runHealthChecks(): Promise<void> {
  logger.info("Starting health checks for all active servers");

  try {
    // Query all active servers
    const activeServers = await db.select().from(mcpServers).where(eq(mcpServers.status, "active"));

    logger.info(`Found ${activeServers.length} active servers to check`);

    // Check each server's health
    for (const server of activeServers) {
      await checkServerHealth(server);
    }

    logger.info("Completed health checks for all servers");
  } catch (error) {
    logger.error("Error running health checks:", error);
  }
}

async function checkServerHealth(server: typeof mcpServers.$inferSelect): Promise<void> {
  const startTime = Date.now();
  let responseTimeMs: number | null = null;
  let statusCode: number | null = null;
  let errorMessage: string | null = null;
  let newStatus: "active" | "inactive" | "error" = server.status;

  try {
    logger.debug(`Checking health for server: ${server.name}`);

    // Create AbortSignal with 5-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      // Fetch health endpoint
      const healthUrl = `${server.endpointUrl}/health`;
      const response = await fetch(healthUrl, {
        signal: controller.signal,
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      clearTimeout(timeoutId);

      responseTimeMs = Date.now() - startTime;
      statusCode = response.status;

      // Determine new status based on response
      if (response.ok) {
        newStatus = "active";
        logger.debug(`Server ${server.name} is healthy (${statusCode}) - ${responseTimeMs}ms`);
      } else {
        newStatus = "error";
        errorMessage = `HTTP ${statusCode}`;
        logger.warn(`Server ${server.name} returned error status: ${statusCode}`);
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error) {
        if (fetchError.name === "AbortError") {
          errorMessage = "Request timeout (5s)";
          logger.warn(`Server ${server.name} health check timed out`);
        } else {
          errorMessage = fetchError.message;
          logger.warn(`Server ${server.name} health check failed: ${fetchError.message}`);
        }
      } else {
        errorMessage = "Unknown error";
        logger.warn(`Server ${server.name} health check failed: Unknown error`);
      }

      newStatus = "error";
      responseTimeMs = Date.now() - startTime;
    }

    // Record health metric
    await db.insert(serverHealthMetrics).values({
      serverId: server.id,
      responseTimeMs,
      statusCode,
      errorMessage,
    });

    // Update server's lastHealthCheck and status
    await db
      .update(mcpServers)
      .set({
        lastHealthCheck: new Date(),
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(mcpServers.id, server.id));

    logger.debug(`Updated server ${server.name} - status: ${newStatus}, response time: ${responseTimeMs}ms`);
  } catch (error) {
    logger.error(`Error checking health for server ${server.name}:`, error);

    // Still try to record the error
    try {
      await db.insert(serverHealthMetrics).values({
        serverId: server.id,
        responseTimeMs: Date.now() - startTime,
        statusCode: null,
        errorMessage: error instanceof Error ? error.message : "Unknown error during health check",
      });
    } catch (insertError) {
      logger.error(`Failed to record health metric for server ${server.name}:`, insertError);
    }
  }
}

// Start the background job (runs every 30 seconds)
// Skip in test environment to avoid interference
if (process.env.NODE_ENV !== "test") {
  logger.info("Starting health check background job (30-second interval)");

  // Run immediately on startup
  runHealthChecks().catch((error) => {
    logger.error("Initial health check failed:", error);
  });

  // Then run every 30 seconds
  setInterval(() => {
    runHealthChecks().catch((error) => {
      logger.error("Scheduled health check failed:", error);
    });
  }, 30000);
}
