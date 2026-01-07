import { boolean, integer, jsonb, pgSchema, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

// ============================================================================
// REGISTRY SCHEMA
// ============================================================================

export const registrySchema = pgSchema("registry");

// Enums
export const serverTypeEnum = registrySchema.enum("server_type", ["official", "community", "mock"]);
export const serverStatusEnum = registrySchema.enum("server_status", ["active", "inactive", "error"]);
export const authTypeEnum = registrySchema.enum("auth_type", ["none", "basic", "bearer", "api_key"]);

// MCP Servers Table
export const mcpServers = registrySchema.table("mcp_servers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  description: text("description"),
  serverType: serverTypeEnum("server_type").notNull(),
  endpointUrl: varchar("endpoint_url", { length: 512 }).notNull(),
  status: serverStatusEnum("status").notNull().default("active"),
  version: varchar("version", { length: 50 }),
  lastHealthCheck: timestamp("last_health_check"),
  // Authentication fields for connecting to protected MCP servers
  authType: authTypeEnum("auth_type"),
  authUsername: varchar("auth_username", { length: 255 }),
  authPassword: varchar("auth_password", { length: 512 }),
  authToken: varchar("auth_token", { length: 1024 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Tools Table
export const tools = registrySchema.table("tools", {
  id: serial("id").primaryKey(),
  serverId: integer("server_id")
    .notNull()
    .references(() => mcpServers.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  inputSchema: jsonb("input_schema"),
  category: varchar("category", { length: 100 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Server Metadata Table
export const serverMetadata = registrySchema.table("server_metadata", {
  serverId: integer("server_id")
    .primaryKey()
    .references(() => mcpServers.id, { onDelete: "cascade" }),
  author: varchar("author", { length: 255 }),
  repositoryUrl: varchar("repository_url", { length: 512 }),
  documentationUrl: varchar("documentation_url", { length: 512 }),
  tags: jsonb("tags"),
});

// ============================================================================
// METRICS SCHEMA
// ============================================================================

export const metricsSchema = pgSchema("metrics");

// Server Health Metrics Table
export const serverHealthMetrics = metricsSchema.table("server_health_metrics", {
  id: serial("id").primaryKey(),
  serverId: integer("server_id")
    .notNull()
    .references(() => mcpServers.id, { onDelete: "cascade" }),
  responseTimeMs: integer("response_time_ms"),
  statusCode: integer("status_code"),
  errorMessage: text("error_message"),
  checkedAt: timestamp("checked_at").notNull().defaultNow(),
});

// Tool Invocations Table
export const toolInvocations = metricsSchema.table("tool_invocations", {
  id: serial("id").primaryKey(),
  serverId: integer("server_id")
    .notNull()
    .references(() => mcpServers.id, { onDelete: "cascade" }),
  toolId: integer("tool_id")
    .notNull()
    .references(() => tools.id, { onDelete: "cascade" }),
  invokedAt: timestamp("invoked_at").notNull().defaultNow(),
  durationMs: integer("duration_ms"),
  success: boolean("success").notNull(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Registry Schema Types
export type McpServer = typeof mcpServers.$inferSelect;
export type NewMcpServer = typeof mcpServers.$inferInsert;

export type Tool = typeof tools.$inferSelect;
export type NewTool = typeof tools.$inferInsert;

export type ServerMetadata = typeof serverMetadata.$inferSelect;
export type NewServerMetadata = typeof serverMetadata.$inferInsert;

// Metrics Schema Types
export type ServerHealthMetric = typeof serverHealthMetrics.$inferSelect;
export type NewServerHealthMetric = typeof serverHealthMetrics.$inferInsert;

export type ToolInvocation = typeof toolInvocations.$inferSelect;
export type NewToolInvocation = typeof toolInvocations.$inferInsert;
