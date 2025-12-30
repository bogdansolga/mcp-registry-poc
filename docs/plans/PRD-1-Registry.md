# PRD-1: Open-source MCP Registry
**Parent:** [MASTER-PRD.md](./MASTER-PRD.md)
**Priority:** 1
**Status:** Ready for Implementation

---

## Overview

Build the core MCP Registry service - a centralized catalog that stores MCP server metadata, tools, and capabilities in a PostgreSQL database. This is the foundation that all other deliverables depend on.

---

## Objectives

1. Create PostgreSQL database schema for registry and metrics
2. Implement REST API for server registration and retrieval
3. Set up HTTP Basic Authentication for API endpoints
4. Enable background health check monitoring
5. Support auto-registration from MCP servers on startup

---

## Technical Requirements

### 1. Database Schema (Drizzle ORM)

**File:** `src/lib/core/db/schema.ts`

Create three schemas following finances-manager pattern:

#### **registry schema**

```typescript
import { pgSchema, serial, varchar, text, timestamp, jsonb, integer } from 'drizzle-orm/pg-core';

export const registrySchema = pgSchema('registry');

// Server types enum
export const serverTypeEnum = registrySchema.enum('server_type', ['official', 'community', 'mock']);
export const serverStatusEnum = registrySchema.enum('server_status', ['active', 'inactive', 'error']);

// MCP Servers table
export const mcpServers = registrySchema.table('mcp_servers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  displayName: varchar('display_name', { length: 200 }).notNull(),
  description: text('description'),
  serverType: serverTypeEnum('server_type').notNull(),
  endpointUrl: varchar('endpoint_url', { length: 500 }).notNull(),
  status: serverStatusEnum('status').notNull().default('active'),
  version: varchar('version', { length: 50 }),
  lastHealthCheck: timestamp('last_health_check'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Tools table
export const tools = registrySchema.table('tools', {
  id: serial('id').primaryKey(),
  serverId: integer('server_id').notNull().references(() => mcpServers.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  inputSchema: jsonb('input_schema').notNull(), // JSON Schema for tool parameters
  category: varchar('category', { length: 50 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Server Metadata table
export const serverMetadata = registrySchema.table('server_metadata', {
  serverId: integer('server_id').primaryKey().references(() => mcpServers.id, { onDelete: 'cascade' }),
  author: varchar('author', { length: 200 }),
  repositoryUrl: varchar('repository_url', { length: 500 }),
  documentationUrl: varchar('documentation_url', { length: 500 }),
  tags: jsonb('tags'), // Array of tags
});

// Type exports
export type McpServer = typeof mcpServers.$inferSelect;
export type NewMcpServer = typeof mcpServers.$inferInsert;
export type Tool = typeof tools.$inferSelect;
export type NewTool = typeof tools.$inferInsert;
export type ServerMetadata = typeof serverMetadata.$inferSelect;
export type NewServerMetadata = typeof serverMetadata.$inferInsert;
```

#### **metrics schema**

```typescript
export const metricsSchema = pgSchema('metrics');

// Health metrics table
export const serverHealthMetrics = metricsSchema.table('server_health_metrics', {
  id: serial('id').primaryKey(),
  serverId: integer('server_id').notNull().references(() => mcpServers.id, { onDelete: 'cascade' }),
  responseTimeMs: integer('response_time_ms'),
  statusCode: integer('status_code'),
  errorMessage: text('error_message'),
  checkedAt: timestamp('checked_at').notNull().defaultNow(),
});

// Tool invocations table
export const toolInvocations = metricsSchema.table('tool_invocations', {
  id: serial('id').primaryKey(),
  serverId: integer('server_id').notNull().references(() => mcpServers.id, { onDelete: 'cascade' }),
  toolId: integer('tool_id').notNull().references(() => tools.id, { onDelete: 'cascade' }),
  invokedAt: timestamp('invoked_at').notNull().defaultNow(),
  durationMs: integer('duration_ms'),
  success: boolean('success').notNull(),
});

export type ServerHealthMetric = typeof serverHealthMetrics.$inferSelect;
export type NewServerHealthMetric = typeof serverHealthMetrics.$inferInsert;
export type ToolInvocation = typeof toolInvocations.$inferSelect;
export type NewToolInvocation = typeof toolInvocations.$inferInsert;
```

### 2. Database Connection

**File:** `src/lib/core/db/index.ts`

Reuse pool config from finances-manager:

```typescript
import { cpus } from 'node:os';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { DB_POOL } from '../constants';
import { logger } from '../utils/logger';
import * as schema from './schema';

const MAX_POOL_SIZE =
  process.env.NODE_ENV === 'development'
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

pool.on('error', (error) => {
  logger.error('Database pool error:', error);
});

export const db: NodePgDatabase<typeof schema> = drizzle(pool, {
  schema: schema,
});

export type Database = typeof db;
```

**File:** `src/lib/core/constants.ts`

```typescript
export const DB_POOL = {
  MIN_CONNECTIONS: 2,
  MAX_CONNECTIONS_DEV: 3,
  MAX_CONNECTIONS_CAP: 20,
  IDLE_TIMEOUT_MS: 30_000,
  CONNECTION_TIMEOUT_MS: 10_000,
} as const;
```

### 3. Instrumentation

**File:** `src/instrumentation.ts`

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { pool } = await import('@/lib/core/db');
    const { logger } = await import('@/lib/core/utils/logger');

    // Check if database is accessible
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      logger.info('Database connection verified');
    } catch (error) {
      logger.error('Database connection failed:', error);
      await pool.end();
      process.exit(1);
    }
  }
}
```

### 4. Authentication Middleware

**File:** `src/lib/auth/basic-auth.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

export function requireBasicAuth(request: NextRequest): NextResponse | null {
  const authHeader = request.headers.get('authorization');

  if (!authHeader?.startsWith('Basic ')) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="MCP Registry"' } }
    );
  }

  const credentials = Buffer.from(authHeader.slice(6), 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');

  const validUsername = process.env.REGISTRY_USERNAME;
  const validPassword = process.env.REGISTRY_PASSWORD;

  if (!validUsername || !validPassword) {
    console.error('REGISTRY_USERNAME or REGISTRY_PASSWORD not set');
    return NextResponse.json(
      { error: 'Server configuration error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }

  if (username !== validUsername || password !== validPassword) {
    return NextResponse.json(
      { error: 'Invalid credentials', code: 'UNAUTHORIZED' },
      { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="MCP Registry"' } }
    );
  }

  return null; // Auth successful
}
```

### 5. REST API Endpoints

#### **POST /api/registry/register**

**File:** `src/app/api/registry/register/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/core/db';
import { mcpServers, tools, serverMetadata } from '@/lib/core/db/schema';
import { requireBasicAuth } from '@/lib/auth/basic-auth';

const RegisterSchema = z.object({
  name: z.string().min(1).max(100),
  display_name: z.string().min(1).max(200),
  description: z.string().optional(),
  server_type: z.enum(['official', 'community', 'mock']),
  endpoint_url: z.string().url(),
  version: z.string().optional(),
  metadata: z.object({
    author: z.string().optional(),
    repository_url: z.string().url().optional(),
    documentation_url: z.string().url().optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
  tools: z.array(z.object({
    name: z.string(),
    description: z.string(),
    input_schema: z.record(z.any()),
    category: z.string().optional(),
  })),
});

export async function POST(request: NextRequest) {
  // Authenticate
  const authError = requireBasicAuth(request);
  if (authError) return authError;

  // Parse body
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  // Validate
  const result = RegisterSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', details: result.error.errors },
      { status: 400 }
    );
  }

  const data = result.data;

  try {
    // Insert server
    const [server] = await db.insert(mcpServers).values({
      name: data.name,
      displayName: data.display_name,
      description: data.description,
      serverType: data.server_type,
      endpointUrl: data.endpoint_url,
      version: data.version,
      status: 'active',
    }).returning();

    // Insert metadata if provided
    if (data.metadata) {
      await db.insert(serverMetadata).values({
        serverId: server.id,
        author: data.metadata.author,
        repositoryUrl: data.metadata.repository_url,
        documentationUrl: data.metadata.documentation_url,
        tags: data.metadata.tags,
      });
    }

    // Insert tools
    if (data.tools.length > 0) {
      await db.insert(tools).values(
        data.tools.map(tool => ({
          serverId: server.id,
          name: tool.name,
          description: tool.description,
          inputSchema: tool.input_schema,
          category: tool.category,
        }))
      );
    }

    // Schedule immediate health check
    // (Will be handled by background job)

    return NextResponse.json({
      id: server.id,
      name: server.name,
      status: server.status,
      created_at: server.createdAt,
    }, { status: 201 });

  } catch (error: any) {
    if (error.code === '23505') { // Unique constraint violation
      return NextResponse.json(
        { error: 'Server with this name already exists', code: 'DUPLICATE_SERVER' },
        { status: 409 }
      );
    }

    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
```

#### **GET /api/registry/servers**

**File:** `src/app/api/registry/servers/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { eq, like, and, sql } from 'drizzle-orm';
import { db } from '@/lib/core/db';
import { mcpServers, tools } from '@/lib/core/db/schema';
import { requireBasicAuth } from '@/lib/auth/basic-auth';

export async function GET(request: NextRequest) {
  const authError = requireBasicAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const type = searchParams.get('type');
  const search = searchParams.get('search');

  try {
    // Build where clause
    const conditions = [];
    if (status) conditions.push(eq(mcpServers.status, status as any));
    if (type) conditions.push(eq(mcpServers.serverType, type as any));
    if (search) {
      conditions.push(
        sql`(${mcpServers.name} ILIKE ${'%' + search + '%'} OR ${mcpServers.displayName} ILIKE ${'%' + search + '%'})`
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
          SELECT COUNT(*)
          FROM ${tools}
          WHERE ${tools.serverId} = ${mcpServers.id}
        )`,
      })
      .from(mcpServers)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(mcpServers.createdAt);

    return NextResponse.json({
      servers,
      total: servers.length,
    });

  } catch (error) {
    console.error('Query error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
```

#### **GET /api/registry/servers/:id**

**File:** `src/app/api/registry/servers/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/core/db';
import { mcpServers, tools, serverMetadata } from '@/lib/core/db/schema';
import { requireBasicAuth } from '@/lib/auth/basic-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = requireBasicAuth(request);
  if (authError) return authError;

  const serverId = parseInt(params.id);
  if (isNaN(serverId)) {
    return NextResponse.json(
      { error: 'Invalid server ID', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  try {
    // Get server
    const [server] = await db
      .select()
      .from(mcpServers)
      .where(eq(mcpServers.id, serverId));

    if (!server) {
      return NextResponse.json(
        { error: 'Server not found', code: 'SERVER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Get metadata
    const [metadata] = await db
      .select()
      .from(serverMetadata)
      .where(eq(serverMetadata.serverId, serverId));

    // Get tools
    const serverTools = await db
      .select()
      .from(tools)
      .where(eq(tools.serverId, serverId));

    return NextResponse.json({
      ...server,
      metadata: metadata || null,
      tools: serverTools,
    });

  } catch (error) {
    console.error('Query error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
```

### 6. Health Check Background Job

**File:** `src/lib/jobs/health-check.ts`

```typescript
import { eq } from 'drizzle-orm';
import { db } from '@/lib/core/db';
import { mcpServers, serverHealthMetrics } from '@/lib/core/db/schema';
import { logger } from '@/lib/core/utils/logger';

export async function runHealthChecks() {
  logger.info('Running health checks...');

  const servers = await db
    .select()
    .from(mcpServers)
    .where(eq(mcpServers.status, 'active'));

  for (const server of servers) {
    const startTime = Date.now();

    try {
      const response = await fetch(`${server.endpointUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5s timeout
      });

      const duration = Date.now() - startTime;

      // Record metric
      await db.insert(serverHealthMetrics).values({
        serverId: server.id,
        responseTimeMs: duration,
        statusCode: response.status,
        errorMessage: null,
        checkedAt: new Date(),
      });

      // Update server status
      await db.update(mcpServers)
        .set({
          lastHealthCheck: new Date(),
          status: response.ok ? 'active' : 'error',
          updatedAt: new Date(),
        })
        .where(eq(mcpServers.id, server.id));

      logger.info(`Health check passed for ${server.name}: ${duration}ms`);

    } catch (error: any) {
      const duration = Date.now() - startTime;

      // Record error
      await db.insert(serverHealthMetrics).values({
        serverId: server.id,
        responseTimeMs: duration,
        statusCode: 0,
        errorMessage: error.message,
        checkedAt: new Date(),
      });

      // Mark as error
      await db.update(mcpServers)
        .set({
          status: 'error',
          lastHealthCheck: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(mcpServers.id, server.id));

      logger.error(`Health check failed for ${server.name}:`, error.message);
    }
  }
}

// Run every 30 seconds
if (process.env.NODE_ENV !== 'test') {
  setInterval(runHealthChecks, 30_000);
}
```

**File:** `src/app/api/jobs/health-check/route.ts`

Cron endpoint to trigger health checks:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { runHealthChecks } from '@/lib/jobs/health-check';

export async function POST(request: NextRequest) {
  // Optional: Add cron secret validation
  const cronSecret = request.headers.get('x-cron-secret');
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await runHealthChecks();

  return NextResponse.json({ success: true });
}
```

---

## Implementation Checklist

- [ ] Create database schema with registry and metrics schemas
- [ ] Set up Drizzle migrations (`drizzle-kit generate` and `drizzle-kit push`)
- [ ] Implement database connection with pool config
- [ ] Add instrumentation for startup validation
- [ ] Create Basic Auth middleware
- [ ] Implement POST /api/registry/register endpoint
- [ ] Implement GET /api/registry/servers endpoint
- [ ] Implement GET /api/registry/servers/:id endpoint
- [ ] Create health check background job
- [ ] Add logger utility (reuse from finances-manager)
- [ ] Test with manual API calls using curl
- [ ] Verify database records are created correctly

---

## Testing

**Manual API Testing:**

```bash
# Register a server
curl -X POST http://localhost:3000/api/registry/register \
  -u admin:password \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test-server",
    "display_name": "Test Server",
    "description": "A test MCP server",
    "server_type": "mock",
    "endpoint_url": "http://localhost:8080",
    "version": "1.0.0",
    "tools": [
      {
        "name": "test_tool",
        "description": "A test tool",
        "input_schema": {"type": "object"},
        "category": "testing"
      }
    ]
  }'

# List servers
curl -u admin:password http://localhost:3000/api/registry/servers | jq

# Get server details
curl -u admin:password http://localhost:3000/api/registry/servers/1 | jq
```

---

## Dependencies

- Next.js 16
- PostgreSQL 18.1
- Drizzle ORM
- Zod (validation)
- node-postgres (pg)

---

## Success Criteria

✅ Database schema created with all tables
✅ 3 API endpoints functional and authenticated
✅ Health check job runs every 30 seconds
✅ Can register 5 MCP servers successfully
✅ Server metadata and tools stored correctly
✅ Health metrics recorded in database

---

## Next Steps

After completing this deliverable:
1. Move to **PRD-2: Observability Dashboard** for metrics visualization
2. Move to **PRD-5: Discovery API** for search functionality
3. Document API endpoints in **PRD-3: Developer Documentation**
