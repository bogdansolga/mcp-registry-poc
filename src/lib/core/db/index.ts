import { cpus } from "node:os";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { DB_POOL } from "../constants";
import { logger } from "../utils/logger";
import * as schema from "./schema";

const MAX_POOL_SIZE =
  process.env.NODE_ENV === "development"
    ? DB_POOL.MAX_CONNECTIONS_DEV
    : Math.min(Math.floor(cpus().length * 2), DB_POOL.MAX_CONNECTIONS_CAP);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: false,
  min: DB_POOL.MIN_CONNECTIONS,
  max: MAX_POOL_SIZE,
  idleTimeoutMillis: DB_POOL.IDLE_TIMEOUT_MS,
  connectionTimeoutMillis: DB_POOL.CONNECTION_TIMEOUT_MS,
});

pool.on("error", (error) => {
  logger.error("Database pool error:", error);
});

export const db: NodePgDatabase<typeof schema> = drizzle(pool, {
  schema: schema,
});

export type Database = typeof db;
