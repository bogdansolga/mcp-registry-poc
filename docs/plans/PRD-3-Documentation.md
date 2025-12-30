# PRD-3: Developer Documentation
**Parent:** [MASTER-PRD.md](./MASTER-PRD.md)
**Priority:** 1
**Status:** Ready for Implementation
**Dependencies:** PRD-1, PRD-2 (need completed features to document)

---

## Overview

Create comprehensive developer documentation including setup guides, API reference, architecture diagrams, and deployment instructions. Documentation should enable any developer to understand, deploy, and extend the MCP Registry.

---

## Objectives

1. Write quick start guide for local development
2. Document all REST API endpoints with examples
3. Create architecture diagrams and system overviews
4. Provide Docker deployment instructions
5. Document database schema and migrations
6. Include troubleshooting guide

---

## Documentation Structure

```
docs/
├── README.md                      # Quick start / Getting started
├── ARCHITECTURE.md                # System architecture & design decisions
├── API.md                         # Complete API reference
├── DEPLOYMENT.md                  # Docker & production deployment
├── DATABASE.md                    # Schema documentation
├── TROUBLESHOOTING.md             # Common issues & solutions
├── CONTRIBUTING.md                # How to contribute (optional)
└── plans/
    ├── MASTER-PRD.md
    ├── PRD-1-Registry.md
    ├── PRD-2-Dashboard.md
    ├── PRD-3-Documentation.md
    ├── PRD-4-Recommendations.md
    └── PRD-5-Discovery.md
```

---

## Documentation Content

### 1. README.md - Quick Start Guide

**File:** `docs/README.md`

```markdown
# MCP Registry & Observability Platform

A centralized registry and observability dashboard for Model Context Protocol (MCP) servers.

## Features

- 🗂️ **Central Registry** - Catalog of MCP servers with metadata and tool definitions
- 📊 **Observability Dashboard** - Health metrics and usage analytics visualization
- 🔍 **Discovery API** - Search and browse available MCP servers and tools
- 🔒 **HTTP Basic Auth** - Simple authentication for API access
- 🐳 **Docker Ready** - One-command deployment with Docker Compose

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)
- pnpm 10+ (package manager)

### 1. Clone Repository

\`\`\`bash
git clone <repository-url>
cd mcp-registry-poc
\`\`\`

### 2. Configure Environment

\`\`\`bash
cp .env.example .env
# Edit .env and set REGISTRY_PASSWORD
\`\`\`

### 3. Start Services

\`\`\`bash
docker-compose up -d
\`\`\`

### 4. Verify Installation

\`\`\`bash
# Check all services are healthy
docker-compose ps

# Test API access
curl -u admin:your-password http://localhost:3000/api/registry/servers
\`\`\`

### 5. Access Dashboard

Open http://localhost:3000 in your browser.

Basic Auth credentials:
- Username: `admin`
- Password: (set in `.env`)

## Project Structure

\`\`\`
mcp-registry-poc/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── api/                # REST API routes
│   │   ├── dashboard/          # Dashboard page
│   │   └── registry/           # Registry browser pages
│   ├── components/             # React components
│   │   ├── ui/                 # ShadCN components
│   │   ├── dashboard/          # Dashboard-specific components
│   │   └── layout/             # Layout components (nav, etc.)
│   └── lib/
│       ├── core/
│       │   ├── db/             # Database schema & connection
│       │   └── utils/          # Utilities (logger, etc.)
│       ├── auth/               # Basic auth middleware
│       └── jobs/               # Background jobs (health checks)
├── docker/                     # MCP server Dockerfiles
├── docs/                       # Documentation (this folder)
├── drizzle/                    # Database migrations
├── docker-compose.yml          # Deployment configuration
└── .env.example                # Environment template
\`\`\`

## Development

### Local Development (without Docker)

\`\`\`bash
# Install dependencies
pnpm install

# Start PostgreSQL (via Docker or local)
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:18.1-alpine

# Run migrations
pnpm db:push

# Start Next.js dev server
pnpm dev
\`\`\`

### Database Migrations

\`\`\`bash
# Generate migration from schema changes
pnpm db:generate

# Apply migrations
pnpm db:push

# Open Drizzle Studio (database GUI)
pnpm db:studio
\`\`\`

## Documentation

- [Architecture](./ARCHITECTURE.md) - System design and technical decisions
- [API Reference](./API.md) - Complete REST API documentation
- [Deployment](./DEPLOYMENT.md) - Docker and production deployment
- [Database](./DATABASE.md) - Schema documentation
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues

## License

MIT
\`\`\`

### 2. ARCHITECTURE.md - System Architecture

**File:** `docs/ARCHITECTURE.md`

```markdown
# Architecture Documentation

## System Overview

The MCP Registry is a Next.js application that provides a centralized catalog and observability platform for Model Context Protocol (MCP) servers.

### High-Level Architecture

\`\`\`
┌──────────────────────────────────────────────────────────┐
│                    Web Clients                           │
│            (Browser / curl / API clients)                │
└──────────────────┬───────────────────────────────────────┘
                   │ HTTP Basic Auth
                   ↓
┌──────────────────────────────────────────────────────────┐
│              Next.js Application (Port 3000)             │
├──────────────────────────────────────────────────────────┤
│  Web UI (React)           API Routes (REST)              │
│  ├── Dashboard            ├── /api/registry/*            │
│  ├── Registry Browser     ├── /api/metrics/*             │
│  └── Server Details       └── /api/jobs/*                │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ↓
┌──────────────────────────────────────────────────────────┐
│           PostgreSQL 18.1 (Port 5432)                    │
├──────────────────────────────────────────────────────────┤
│  Schemas:                                                │
│  ├── registry (servers, tools, metadata)                 │
│  └── metrics (health_metrics, tool_invocations)          │
└──────────────────────────────────────────────────────────┘
                   ▲
                   │ Auto-registration on startup
                   │
┌──────────────────────────────────────────────────────────┐
│                 MCP Servers (Docker)                     │
├──────────────────────────────────────────────────────────┤
│  • filesystem-mcp      (Official)                        │
│  • postgresql-mcp      (Official)                        │
│  • jira-mcp            (Community)                       │
│  • context7-mcp        (Community)                       │
│  • file-ops-mock       (Mock)                            │
└──────────────────────────────────────────────────────────┘
\`\`\`

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | Next.js 16 App Router | Server-side rendering, React framework |
| UI Library | ShadCN + Radix UI | Component library |
| Styling | Tailwind CSS v4 | Utility-first CSS |
| Backend | Next.js API Routes | RESTful API endpoints |
| Database | PostgreSQL 18.1 | Primary data store |
| ORM | Drizzle | Type-safe database queries |
| Auth | HTTP Basic Auth | API authentication |
| Charts | Recharts | Data visualization |
| Deployment | Docker Compose | Container orchestration |

## Database Schema

See [DATABASE.md](./DATABASE.md) for complete schema documentation.

**Key tables:**
- `registry.mcp_servers` - Server catalog
- `registry.tools` - Tool definitions
- `metrics.server_health_metrics` - Health check results
- `metrics.tool_invocations` - Usage tracking

## Data Flow

### Server Registration Flow

1. MCP server starts (Docker container)
2. Server reads `REGISTRY_URL` from environment
3. Server POSTs to `/api/registry/register` with:
   - Server metadata (name, version, description)
   - Tool list (name, input schema, category)
   - Metadata (author, repo URL, tags)
4. Registry API:
   - Validates Basic Auth credentials
   - Validates request body (Zod schema)
   - Inserts records into database
   - Schedules immediate health check
5. Returns 201 Created with server ID

### Health Monitoring Flow

1. Background job runs every 30 seconds
2. Queries all `active` servers from database
3. For each server:
   - Fetches `{endpoint_url}/health` (5s timeout)
   - Records response time and status
   - Updates server status (`active` or `error`)
   - Stores metric in `server_health_metrics` table
4. Retry logic: 3 attempts with exponential backoff
5. Error handling: Logs error message in database

### Metrics Aggregation Flow

1. Dashboard loads → fetches `/api/metrics/health`
2. API queries database:
   - Server counts by status
   - Response time percentiles (P95, P99)
   - Uptime calculation (successful checks / total)
3. Returns aggregated JSON
4. Dashboard renders charts with Recharts

## Authentication

### HTTP Basic Auth

All API endpoints require Basic Authentication:

\`\`\`http
Authorization: Basic <base64(username:password)>
\`\`\`

Credentials configured via environment variables:
- `REGISTRY_USERNAME`
- `REGISTRY_PASSWORD`

### Auth Middleware

Located in `src/lib/auth/basic-auth.ts`:
- Extracts Authorization header
- Decodes Base64 credentials
- Validates against env vars
- Returns 401 if invalid

### Browser Access

When accessing web UI, browser prompts for Basic Auth credentials via `WWW-Authenticate` header.

## Background Jobs

### Health Check Job

**Location:** `src/lib/jobs/health-check.ts`

**Trigger:** `setInterval(runHealthChecks, 30_000)` in app startup

**Responsibilities:**
- Fetch all active servers
- Make HTTP GET requests to `/health` endpoint
- Record metrics (response time, status code, errors)
- Update server status in database

**Error Handling:**
- 5-second timeout per request
- 3 retry attempts with exponential backoff
- Error messages stored in `error_message` column
- Server marked as `error` status after failures

## Design Decisions

### Why Next.js App Router?

- Server components for better performance
- API routes colocated with pages
- Built-in TypeScript support
- Easy deployment

### Why Drizzle ORM?

- Type-safe queries (full TypeScript inference)
- Lightweight (no runtime schema parsing)
- Excellent migration support
- SQL-like syntax

### Why HTTP Basic Auth (not OAuth)?

- PoC simplicity
- API-first design (server-to-server communication)
- No session management complexity
- Easily upgradeable to OAuth later

### Why PostgreSQL?

- Robust ACID compliance
- JSON support (for tool schemas, tags)
- Proven scalability
- Rich ecosystem

### Why Manual Refresh (not WebSockets)?

- PoC scope reduction
- Simpler implementation
- Sufficient for demo purposes
- Can add real-time later

## Security Considerations

1. **Credentials in Environment**: Never commit `.env` to git
2. **Basic Auth over HTTPS**: Use HTTPS in production
3. **SQL Injection**: Drizzle prevents injection via parameterized queries
4. **Rate Limiting**: Not implemented in PoC (add in production)
5. **CORS**: Configure allowed origins in production

## Performance Considerations

1. **Connection Pooling**: Reuses DB connections (min: 2, max: 3-20)
2. **Database Indexes**: Add indexes on frequently queried columns
3. **Query Optimization**: Use SQL aggregations instead of in-memory processing
4. **Health Check Throttling**: 30-second interval prevents server overload

## Future Enhancements

See [PRD-4: Recommendations](../plans/PRD-4-Recommendations.md) for production roadmap.
\`\`\`

### 3. API.md - API Reference

**File:** `docs/API.md`

```markdown
# API Reference

Complete documentation for all REST API endpoints.

## Authentication

All endpoints require HTTP Basic Authentication:

\`\`\`bash
curl -u username:password https://registry.example.com/api/endpoint
\`\`\`

Or with explicit header:

\`\`\`bash
curl -H "Authorization: Basic $(echo -n 'username:password' | base64)" \\
  https://registry.example.com/api/endpoint
\`\`\`

## Base URL

- Development: `http://localhost:3000`
- Production: `https://your-domain.com`

---

## Registry Endpoints

### POST /api/registry/register

Register a new MCP server.

**Request Body:**

\`\`\`json
{
  "name": "example-mcp",
  "display_name": "Example MCP Server",
  "description": "A sample MCP server",
  "server_type": "official",
  "endpoint_url": "http://example-mcp:8080",
  "version": "1.0.0",
  "metadata": {
    "author": "John Doe",
    "repository_url": "https://github.com/example/mcp-server",
    "documentation_url": "https://docs.example.com",
    "tags": ["database", "sql"]
  },
  "tools": [
    {
      "name": "query",
      "description": "Execute SQL query",
      "input_schema": {
        "type": "object",
        "properties": {
          "sql": { "type": "string" }
        },
        "required": ["sql"]
      },
      "category": "database"
    }
  ]
}
\`\`\`

**Response:** `201 Created`

\`\`\`json
{
  "id": 1,
  "name": "example-mcp",
  "status": "active",
  "created_at": "2025-12-30T10:00:00Z"
}
\`\`\`

**Error Responses:**

- `400 Bad Request` - Validation error
- `401 Unauthorized` - Invalid credentials
- `409 Conflict` - Server name already exists
- `500 Internal Server Error` - Server error

**Example:**

\`\`\`bash
curl -X POST http://localhost:3000/api/registry/register \\
  -u admin:password \\
  -H "Content-Type: application/json" \\
  -d @server-config.json
\`\`\`

---

### GET /api/registry/servers

List all registered MCP servers.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status: `active`, `inactive`, `error` |
| `type` | string | Filter by type: `official`, `community`, `mock` |
| `search` | string | Search by name or display name |

**Response:** `200 OK`

\`\`\`json
{
  "servers": [
    {
      "id": 1,
      "name": "filesystem-mcp",
      "display_name": "Filesystem Server",
      "server_type": "official",
      "status": "active",
      "tools_count": 12,
      "last_health_check": "2025-12-30T10:30:00Z",
      "version": "1.0.0"
    }
  ],
  "total": 1
}
\`\`\`

**Examples:**

\`\`\`bash
# List all servers
curl -u admin:password http://localhost:3000/api/registry/servers

# Filter by status
curl -u admin:password http://localhost:3000/api/registry/servers?status=active

# Search
curl -u admin:password http://localhost:3000/api/registry/servers?search=file
\`\`\`

---

### GET /api/registry/servers/:id

Get detailed information about a specific server.

**Response:** `200 OK`

\`\`\`json
{
  "id": 1,
  "name": "filesystem-mcp",
  "display_name": "Filesystem Server",
  "description": "Official filesystem MCP server",
  "server_type": "official",
  "endpoint_url": "http://mcp-filesystem:8080",
  "status": "active",
  "version": "1.0.0",
  "last_health_check": "2025-12-30T10:30:00Z",
  "created_at": "2025-12-30T09:00:00Z",
  "updated_at": "2025-12-30T10:30:00Z",
  "metadata": {
    "author": "Anthropic",
    "repository_url": "https://github.com/anthropics/mcp-server-filesystem",
    "documentation_url": "https://docs.mcp.io",
    "tags": ["filesystem", "official"]
  },
  "tools": [
    {
      "id": 1,
      "name": "read_file",
      "description": "Read contents of a file",
      "input_schema": { ... },
      "category": "filesystem"
    }
  ]
}
\`\`\`

**Error Responses:**

- `400 Bad Request` - Invalid ID format
- `404 Not Found` - Server not found

**Example:**

\`\`\`bash
curl -u admin:password http://localhost:3000/api/registry/servers/1 | jq
\`\`\`

---

## Metrics Endpoints

### GET /api/metrics/health

Get aggregated health metrics across all servers.

**Response:** `200 OK`

\`\`\`json
{
  "total_servers": 5,
  "active_servers": 4,
  "inactive_servers": 0,
  "error_servers": 1,
  "avg_response_time_ms": 45,
  "p95_response_time_ms": 120,
  "p99_response_time_ms": 180,
  "uptime_percent": 98.5,
  "last_updated": "2025-12-30T10:35:00Z"
}
\`\`\`

---

### GET /api/metrics/usage

Get usage analytics for tool invocations.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | string | `24h` | Time period: `24h`, `7d`, `30d` |

**Response:** `200 OK`

\`\`\`json
{
  "total_invocations": 1520,
  "success_rate": 99.2,
  "top_tools": [
    {
      "tool_id": 3,
      "tool_name": "read_file",
      "server_name": "filesystem-mcp",
      "invocation_count": 450,
      "avg_duration_ms": 12
    }
  ],
  "invocations_over_time": [
    {
      "timestamp": "2025-12-30T08:00:00Z",
      "count": 45
    }
  ]
}
\`\`\`

---

### GET /api/metrics/servers/:id/stats

Get metrics for a specific server.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | string | `24h` | Time period: `24h`, `7d`, `30d` |

**Response:** `200 OK`

\`\`\`json
{
  "server_id": 1,
  "uptime_percent": 99.5,
  "avg_response_time_ms": 42,
  "error_count": 2,
  "total_invocations": 320,
  "response_times": [
    {
      "timestamp": "2025-12-30T10:00:00Z",
      "response_time_ms": 38
    }
  ],
  "error_log": [
    {
      "timestamp": "2025-12-30T09:15:00Z",
      "error_message": "Connection timeout",
      "status_code": 0
    }
  ]
}
\`\`\`

---

## Error Response Format

All errors follow this format:

\`\`\`json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "statusCode": 400,
  "details": { /* Optional additional context */ }
}
\`\`\`

**Error Codes:**

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid credentials |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `SERVER_NOT_FOUND` | 404 | Server ID not found |
| `TOOL_NOT_FOUND` | 404 | Tool ID not found |
| `DUPLICATE_SERVER` | 409 | Server name already exists |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Rate Limiting

**Not implemented in PoC.** For production deployment, implement rate limiting using:
- API Gateway (e.g., Kong, Tyk)
- Middleware (e.g., express-rate-limit)
- Reverse proxy (e.g., Nginx)

---

## Postman Collection

Import this collection for testing: `docs/postman_collection.json` (TODO: Generate)
\`\`\`

### 4. DEPLOYMENT.md

**File:** `docs/DEPLOYMENT.md`

```markdown
# Deployment Guide

## Docker Compose Deployment (Recommended for PoC)

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 2GB RAM minimum
- 10GB disk space

### Steps

1. **Clone repository**

\`\`\`bash
git clone <repository-url>
cd mcp-registry-poc
\`\`\`

2. **Configure environment**

\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` and set:
- `REGISTRY_PASSWORD` - Choose a strong password
- `JIRA_*` variables (if using JIRA server)
- `CONTEXT7_API_KEY` (if using Context7 server)

3. **Start services**

\`\`\`bash
docker-compose up -d
\`\`\`

4. **Check health**

\`\`\`bash
docker-compose ps
docker-compose logs -f registry-app
\`\`\`

5. **Access application**

- Web UI: http://localhost:3000
- API: http://localhost:3000/api
- Database: localhost:5432 (Postgres)

### Stopping Services

\`\`\`bash
docker-compose down
\`\`\`

### Cleaning Up

\`\`\`bash
# Stop and remove containers + volumes
docker-compose down -v
\`\`\`

---

## Local Development (Non-Docker)

### Prerequisites

- Node.js 20+
- pnpm 10+
- PostgreSQL 18.1

### Steps

1. **Install dependencies**

\`\`\`bash
pnpm install
\`\`\`

2. **Start PostgreSQL**

\`\`\`bash
docker run -d --name mcp-postgres \\
  -e POSTGRES_DB=mcp_registry \\
  -e POSTGRES_USER=mcp_user \\
  -e POSTGRES_PASSWORD=mcp_password \\
  -p 5432:5432 \\
  postgres:18.1-alpine
\`\`\`

3. **Set up database**

\`\`\`bash
# Run migrations
pnpm db:push
\`\`\`

4. **Start dev server**

\`\`\`bash
pnpm dev
\`\`\`

---

## Production Deployment (Future)

### Kubernetes

See `k8s/` directory for manifests (TODO).

### Cloud Platforms

- **AWS ECS** - Use Fargate with RDS PostgreSQL
- **GCP Cloud Run** - With Cloud SQL PostgreSQL
- **Azure Container Apps** - With Azure Database for PostgreSQL

### Environment Variables for Production

\`\`\`bash
DATABASE_URL=postgresql://user:pass@prod-db:5432/mcp_registry
REGISTRY_USERNAME=admin
REGISTRY_PASSWORD=<strong-password>
NEXT_PUBLIC_APP_URL=https://registry.yourdomain.com
NODE_ENV=production
\`\`\`

### HTTPS Configuration

Use reverse proxy (Nginx, Traefik, Caddy) for SSL termination:

\`\`\`nginx
server {
  listen 443 ssl http2;
  server_name registry.yourdomain.com;

  ssl_certificate /etc/ssl/certs/cert.pem;
  ssl_certificate_key /etc/ssl/private/key.pem;

  location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
\`\`\`

---

## Monitoring & Logs

### View Logs

\`\`\`bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f registry-app
\`\`\`

### Database Access

\`\`\`bash
docker exec -it mcp-postgres psql -U mcp_user -d mcp_registry
\`\`\`

### Health Checks

\`\`\`bash
# Application health
curl -u admin:password http://localhost:3000/api/metrics/health

# Database connectivity
docker exec mcp-postgres pg_isready
\`\`\`

---

## Backup & Restore

### Database Backup

\`\`\`bash
docker exec mcp-postgres pg_dump -U mcp_user mcp_registry > backup.sql
\`\`\`

### Database Restore

\`\`\`bash
docker exec -i mcp-postgres psql -U mcp_user mcp_registry < backup.sql
\`\`\`

---

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues.
\`\`\`

---

## Implementation Checklist

- [ ] Create README.md with quick start guide
- [ ] Create ARCHITECTURE.md with system diagrams
- [ ] Create API.md with all endpoint documentation
- [ ] Create DEPLOYMENT.md with Docker instructions
- [ ] Create DATABASE.md with schema documentation
- [ ] Create TROUBLESHOOTING.md with common issues
- [ ] Add code examples to all API endpoints
- [ ] Include curl commands for testing
- [ ] Test all documentation steps
- [ ] Add screenshots to README (optional)

---

## Success Criteria

✅ README provides 5-minute quick start
✅ API documentation covers all endpoints with examples
✅ Architecture diagrams are clear and accurate
✅ Deployment guide tested on clean machine
✅ Database schema fully documented
✅ Troubleshooting covers 5+ common issues

---

## Dependencies

- Completed PRD-1 (Registry)
- Completed PRD-2 (Dashboard)
- Screenshots/diagrams tool (optional: draw.io, mermaid)
