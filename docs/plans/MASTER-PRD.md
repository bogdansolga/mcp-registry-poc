# Product Requirements Document (PRD)
## MCP Registry & Agentic Infrastructure - Proof of Concept

**Version:** 1.0
**Date:** 2025-12-30
**Status:** Approved

---

## Executive Summary

This PRD defines a Proof of Concept (PoC) for an **MCP Registry & Observability Platform** that addresses the challenge of managing Model Context Protocol (MCP) servers in a development environment. The system provides a centralized catalog for MCP server discovery, health monitoring, and usage analytics, with HTTP Basic Authentication for API-based interactions.

### Key Objectives
- Demonstrate centralized MCP server registry with discovery capabilities
- Provide observability dashboard for health metrics and usage analytics
- Document authentication approaches and MCP protocol gaps
- Validate architecture for future multi-user production deployment

### Success Criteria
- Docker Compose one-command startup
- 4+ MCP servers successfully registered (Filesystem, PostgreSQL, JIRA, Context7, File-ops mock)
- Real-time health monitoring with manual refresh
- Comprehensive recommendations report on auth patterns and protocol gaps

---

## 1. Product Overview

### 1.1 Problem Statement

Organizations adopting MCP face several challenges:
- **Discovery:** No central catalog of available MCP servers and their capabilities
- **Observability:** Lack of visibility into server health, performance, and usage patterns
- **Authentication:** Native MCP servers designed for single-user scenarios; multi-user auth requires additional infrastructure
- **Documentation:** Limited guidance on production deployment patterns

### 1.2 Solution

A Next.js-based registry platform providing:
1. **Central Registry:** Catalog of MCP servers with metadata, tools, and capabilities
2. **Health Monitoring:** Automated health checks with response time tracking
3. **Usage Analytics:** Tool invocation metrics and popularity trends
4. **Web Dashboard:** Visual interface for browsing registry and viewing metrics
5. **Recommendations Report:** Documented findings on auth approaches and protocol gaps

### 1.3 Scope

**In Scope (Phase 1 - PoC):**
- Registry API for server registration and discovery
- Observability metrics (health + usage analytics)
- Web UI with ShadCN + Tailwind CSS v4
- Docker Compose local deployment
- HTTP Basic Auth for API access
- PostgreSQL + Drizzle ORM persistence
- Integration with 4 real MCP servers + 1 mock server
- Recommendations report documentation

**Out of Scope (Future Phases):**
- Multi-user per-tool credential management (MCP Proxy)
- Real-time WebSocket updates
- Production cloud deployment
- Advanced analytics (ML-based insights)
- Automated testing suite
- Rate limiting / API quotas

---

## 2. Phase 1 Deliverables

| # | Deliverable | Priority | Description | PRD Reference |
|---|-------------|----------|-------------|---------------|
| 1 | **Open-source MCP Registry** | 1 | Central catalog with PostgreSQL persistence | `PRD-1-Registry.md` |
| 2 | **Observability Dashboard** | 1 | Web UI for health metrics and usage analytics | `PRD-2-Dashboard.md` |
| 3 | **Developer Documentation** | 1 | Setup guide, API docs, architecture diagrams | `PRD-3-Documentation.md` |
| 4 | **Recommendations Report** | 1 | Auth approaches, MCP protocol gaps, next steps | `PRD-4-Recommendations.md` |
| 5 | **Discovery API/Portal** | 2 | Search and browse MCP servers/tools | `PRD-5-Discovery.md` |

---

## 3. Technical Architecture

### 3.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     MCP Registry PoC                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐      ┌──────────────┐    ┌─────────────┐ │
│  │  Web UI     │─────▶│  Next.js API │───▶│  PostgreSQL │ │
│  │  (ShadCN)   │      │   (REST)     │    │  + Drizzle  │ │
│  └─────────────┘      └──────────────┘    └─────────────┘ │
│         │                    ▲                             │
│         │                    │ Registration                │
│         ▼                    │ Health Checks               │
│  ┌─────────────────────────────────────────┐              │
│  │     Observability Dashboard              │              │
│  │  - Health Metrics (manual refresh)       │              │
│  │  - Usage Analytics                       │              │
│  └─────────────────────────────────────────┘              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          ▲
                          │ HTTP Basic Auth
                          │
    ┌─────────────────────┴──────────────────────┐
    │         MCP Servers (Docker)               │
    ├────────────────────────────────────────────┤
    │  • Filesystem (official)                   │
    │  • PostgreSQL (official)                   │
    │  • JIRA (community)                        │
    │  • Context7 (community)                    │
    │  • File Operations (mock)                  │
    └────────────────────────────────────────────┘
```

### 3.2 Technology Stack

| Layer | Technology | Justification |
|-------|------------|---------------|
| **Frontend** | Next.js 16 App Router | Server-side rendering, API routes |
| **UI Components** | ShadCN (new-york) | Consistent design system, reuses finances-manager config |
| **Styling** | Tailwind CSS v4 | Utility-first, theme variables |
| **Backend** | Next.js API Routes | Unified codebase, TypeScript end-to-end |
| **Database** | PostgreSQL 18.1 | Relational data, ACID compliance |
| **ORM** | Drizzle | Type-safe queries, schema-based organization |
| **Authentication** | HTTP Basic Auth | Simple API authentication for server-to-server calls |
| **Deployment** | Docker Compose | Local development, reproducible environment |
| **Monitoring** | Custom metrics storage | PostgreSQL-backed health/usage tracking |

---

## 4. Database Schema

### 4.1 Schema Organization

Following the finances-manager pattern, we use PostgreSQL schemas for logical separation:

- `registry` - Server catalog and tool definitions
- `metrics` - Observability data (health checks, invocations)
- `auth` - Basic auth credentials (optional for future OAuth)

### 4.2 Core Tables

#### **registry.mcp_servers**
```typescript
{
  id: serial (PK),
  name: varchar,                    // "filesystem-mcp", "jira-mcp"
  display_name: varchar,             // "Filesystem Server"
  description: text,
  server_type: enum('official' | 'community' | 'mock'),
  endpoint_url: varchar,             // Connection endpoint
  status: enum('active' | 'inactive' | 'error'),
  version: varchar,
  last_health_check: timestamp,
  created_at: timestamp,
  updated_at: timestamp
}
```

#### **registry.tools**
```typescript
{
  id: serial (PK),
  server_id: integer (FK -> mcp_servers),
  name: varchar,                     // "read_file", "create_issue"
  description: text,
  input_schema: jsonb,               // Tool parameters schema
  category: varchar,                 // "filesystem", "project-management"
  created_at: timestamp
}
```

#### **registry.server_metadata**
```typescript
{
  server_id: integer (FK -> mcp_servers, PK),
  author: varchar,
  repository_url: varchar,
  documentation_url: varchar,
  tags: jsonb                        // Array of tags
}
```

#### **metrics.server_health_metrics**
```typescript
{
  id: serial (PK),
  server_id: integer (FK -> mcp_servers),
  response_time_ms: integer,
  status_code: integer,
  error_message: text (nullable),
  checked_at: timestamp
}
```

#### **metrics.tool_invocations**
```typescript
{
  id: serial (PK),
  server_id: integer (FK -> mcp_servers),
  tool_id: integer (FK -> tools),
  invoked_at: timestamp,
  duration_ms: integer,
  success: boolean
}
```

---

## 5. Authentication & Authorization

### 5.1 Authentication Strategy

**Primary: HTTP Basic Auth for API Calls**

Since MCP servers interact with the registry via API calls (not browser-based), we use HTTP Basic Authentication:

```http
POST /api/registry/register
Authorization: Basic base64(username:password)
Content-Type: application/json
```

**Environment Variables:**
```bash
REGISTRY_USERNAME=admin
REGISTRY_PASSWORD=secure-password-here
```

### 5.2 Auth Scope

All endpoints require authentication. No public access for PoC.

---

## 6. Deployment

### 6.1 Docker Compose Setup

**Services:**
- `postgres` - PostgreSQL 18.1-alpine
- `registry-app` - Next.js application
- `mcp-filesystem` - Official Filesystem MCP server
- `mcp-postgresql` - Official PostgreSQL MCP server
- `mcp-jira` - JIRA integration server
- `mcp-context7` - Context7 documentation server
- `mcp-file-ops-mock` - Mock server for testing

**One-command startup:**
```bash
docker-compose up -d
```

---

## 7. Success Metrics

| Metric | Target | Validation Method |
|--------|--------|-------------------|
| **Startup time** | < 60 seconds | `docker-compose up -d && docker logs -f registry-app` |
| **Server registration** | 5/5 servers registered | Check `/api/registry/servers` response |
| **Health monitoring** | All active servers checked every 30s | Query `server_health_metrics` table |
| **Dashboard load time** | < 2 seconds | Browser dev tools network tab |
| **API response time** | P95 < 500ms | `/api/metrics/health` analytics |
| **Documentation completeness** | All 5 deliverables present | Review `docs/` directory |

---

## 8. Timeline

**Total Duration:** 5 weeks (part-time effort, ~20 hours/week)

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 1: Foundation** | Week 1 | Database schema, API scaffolding, Docker setup |
| **Phase 2: Integration** | Week 2 | MCP server integration, health monitoring |
| **Phase 3: UI** | Week 3 | Web dashboard, registry browser, ShadCN components |
| **Phase 4: Documentation** | Week 4 | API docs, recommendations report, deployment guide |
| **Phase 5: Demo Prep** | Week 5 | Testing, bug fixes, demo script, stakeholder presentation |

---

## 9. References

- [MCP Specification](https://modelcontextprotocol.io)
- [AI Integration into SDLC with MCP](../AI%20Integration%20into%20SDLC%20with%20MCP.pdf)
- [MCP Registry & Agentic Infrastructure Priorities](../MCP%20Registry%20&%20Agentic%20Infrastructure.pdf)
- [Better Auth Documentation](https://better-auth.com)
- [ShadCN UI](https://ui.shadcn.com)
- [Drizzle ORM](https://orm.drizzle.team)

---

**Next Steps:**
1. Review and approve this master PRD
2. Review individual deliverable PRDs (PRD-1 through PRD-5)
3. Begin implementation using subagent-driven development
4. Track progress in project management tool

---

**End of Master PRD**
