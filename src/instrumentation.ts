export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { pool } = await import("@/lib/core/db");
    const { logger } = await import("@/lib/core/utils/logger");

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
  }
}
