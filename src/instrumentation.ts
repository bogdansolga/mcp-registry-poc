/**
 * Validates required registry environment variables
 */
function validateRegistryEnv(): void {
  const required = ["REGISTRY_USERNAME", "REGISTRY_PASSWORD", "DATABASE_URL"];
  const missing: string[] = [];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Dynamic imports to avoid loading Node.js modules in Edge Runtime
    const { pool } = await import("@/lib/core/db");
    const { logger } = await import("@/lib/core/utils/logger");

    // Validate registry environment variables
    try {
      validateRegistryEnv();
      logger.info("Registry environment variables validated");
    } catch (error) {
      logger.error("Registry environment validation failed:", error);
      process.exit(1);
    }

    // Check if database is accessible
    try {
      const client = await pool.connect();
      await client.query("SELECT 1");
      client.release();
      logger.info("Database connection verified");
    } catch (error) {
      logger.error("Database connection failed:", error);
      await pool.end();
      process.exit(1);
    }

    // Check database schemas exist
    try {
      const client = await pool.connect();
      const result = await client.query(`
        SELECT schema_name
        FROM information_schema.schemata
        WHERE schema_name IN ('registry', 'metrics')
      `);
      client.release();

      const schemas = result.rows.map((r: { schema_name: string }) => r.schema_name);
      if (schemas.includes("registry") && schemas.includes("metrics")) {
        logger.info("Database schemas verified: registry, metrics");
      } else {
        logger.warn("Some database schemas missing. Run migrations: pnpm db:push");
      }
    } catch (error) {
      logger.warn("Could not verify database schemas:", error);
    }

    // Log registered server count on startup
    try {
      const { db } = await import("@/lib/core/db");
      const { mcpServers } = await import("@/lib/core/db/schema");
      const { sql } = await import("drizzle-orm");

      const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(mcpServers);

      logger.info(`MCP Registry initialized with ${countResult.count} registered server(s)`);
    } catch (error) {
      logger.warn("Could not count registered servers:", error);
    }
  }
}
