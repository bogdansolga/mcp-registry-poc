# MCP Registry PoC - Implementation Plans

This directory contains the master PRD and individual deliverable PRDs for the MCP Registry Proof of Concept.

## Document Structure

```
docs/plans/
├── README.md                    # This file
├── MASTER-PRD.md                # Complete project requirements
├── PRD-1-Registry.md            # Priority 1: Core registry service
├── PRD-2-Dashboard.md           # Priority 1: Observability dashboard
├── PRD-3-Documentation.md       # Priority 1: Developer docs
├── PRD-4-Recommendations.md     # Priority 1: Recommendations report
└── PRD-5-Discovery.md           # Priority 2: Search & discovery
```

## Implementation Approach

### Using Subagent-Driven Development

Each PRD is designed to be implemented independently using the `superpowers:subagent-driven-development` skill:

```bash
# Example: Implement the Registry deliverable
/subagent-driven-development docs/plans/PRD-1-Registry.md
```

### Recommended Implementation Order

**Phase 1 - Foundation (Week 1)**
1. **PRD-1: Registry** ← Start here (foundation for everything)
   - Database schema
   - REST APIs
   - Authentication
   - Health checks

**Phase 2 - Visualization (Week 2-3)**
2. **PRD-2: Dashboard** (depends on PRD-1)
   - Metrics APIs
   - Charts and visualizations
   - Manual refresh

3. **PRD-5: Discovery** (depends on PRD-1)
   - Search API
   - Registry browser UI
   - Server detail pages

**Phase 3 - Documentation (Week 4)**
4. **PRD-3: Documentation** (depends on PRD-1, PRD-2, PRD-5)
   - Quick start guide
   - API reference
   - Architecture docs
   - Deployment guide

**Phase 4 - Analysis (Week 5)**
5. **PRD-4: Recommendations** (depends on all PRDs)
   - Implementation analysis
   - Auth architecture review
   - Protocol gap identification
   - Production roadmap

## Deliverables Checklist

- [ ] **Priority 1:** Open-source MCP Registry (PRD-1)
- [ ] **Priority 1:** Observability Dashboard (PRD-2)
- [ ] **Priority 1:** Developer Documentation (PRD-3)
- [ ] **Priority 1:** Recommendations Report (PRD-4)
- [ ] **Priority 2:** Discovery API/Portal (PRD-5)

## Key Features by PRD

### PRD-1: Registry
- PostgreSQL database with Drizzle ORM
- 3 REST API endpoints (register, list, get)
- HTTP Basic Auth middleware
- Background health check job (30s interval)
- Support for 5 MCP servers (Filesystem, PostgreSQL, JIRA, Context7, File-ops mock)

### PRD-2: Dashboard
- 3 metrics API endpoints (health, usage, server stats)
- 4 chart cards (pie, bar, line, horizontal bar)
- Manual refresh button
- Recharts integration
- Responsive grid layout

### PRD-3: Documentation
- README.md (quick start)
- ARCHITECTURE.md (system design)
- API.md (endpoint reference)
- DEPLOYMENT.md (Docker setup)
- DATABASE.md (schema docs)
- TROUBLESHOOTING.md (common issues)

### PRD-4: Recommendations
- Executive summary
- Auth architecture analysis (first hop vs second hop)
- MCP protocol gap identification
- MCP Proxy pattern design
- Phased production roadmap (Phases 2-4)
- Security and scalability recommendations

### PRD-5: Discovery
- Search API endpoint
- Category browsing API
- Registry browser UI with filters
- Server detail pages with tabs
- Tag-based discovery

## Dependencies Graph

```
PRD-1 (Registry)
  ├─→ PRD-2 (Dashboard)
  ├─→ PRD-5 (Discovery)
  └─→ PRD-3 (Documentation)
        └─→ PRD-4 (Recommendations)

Legend:
  A → B means "B depends on A"
```

## Success Metrics

| Metric | Target |
|--------|--------|
| Startup time | < 60 seconds |
| Servers registered | 5/5 |
| Health check frequency | Every 30s |
| Dashboard load time | < 2 seconds |
| API response time (P95) | < 500ms |
| Documentation completeness | 100% |

## Technology Stack

- **Frontend:** Next.js 16 App Router, React 19
- **UI:** ShadCN (new-york), Tailwind CSS v4
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL 18.1-alpine
- **ORM:** Drizzle
- **Auth:** HTTP Basic Auth
- **Charts:** Recharts
- **Deployment:** Docker Compose
- **Icons:** Lucide React

## Environment Setup

```bash
# Required environment variables
DATABASE_URL=postgresql://mcp_user:mcp_password@localhost:5432/mcp_registry
REGISTRY_USERNAME=admin
REGISTRY_PASSWORD=your-secure-password
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Optional (for real MCP servers)
JIRA_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-jira-api-token
CONTEXT7_API_KEY=your-context7-key
```

## Quick Start (Docker)

```bash
# 1. Clone repo
git clone <repository-url>
cd mcp-registry-poc

# 2. Configure environment
cp .env.example .env
# Edit .env and set REGISTRY_PASSWORD

# 3. Start all services
docker-compose up -d

# 4. Verify
curl -u admin:password http://localhost:3000/api/registry/servers

# 5. Access web UI
open http://localhost:3000
```

## Development Workflow

### For Each PRD

1. **Read the PRD** - Understand objectives, requirements, success criteria
2. **Review dependencies** - Ensure prerequisite PRDs are complete
3. **Create feature branch** - `git checkout -b feature/prd-1-registry`
4. **Implement checklist items** - Follow PRD implementation checklist
5. **Test manually** - Use curl commands and browser testing
6. **Update documentation** - Document new features
7. **Create PR** - Submit for review
8. **Deploy** - Merge and deploy to environment

### Using Subagent-Driven Development

```bash
# Start implementation
/subagent-driven-development docs/plans/PRD-X-Name.md

# The subagent will:
# 1. Read the PRD
# 2. Break down into tasks
# 3. Implement code following the specifications
# 4. Run tests (if any)
# 5. Report completion
```

## Notes

- **Tests:** Not included in PoC scope (PRD-3 notes "no tests for now; may add later")
- **Better-Auth:** Considered but deferred (using HTTP Basic Auth for simplicity)
- **Real-time Updates:** Not implemented (manual refresh only for PoC)
- **Rate Limiting:** Not implemented (add in production)
- **Multi-region:** Not implemented (single-instance deployment)

## Questions or Issues?

- Check [MASTER-PRD.md](./MASTER-PRD.md) for overall context
- Review individual PRDs for detailed specs
- See [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) for common issues (after PRD-3)

## Next Steps

1. ✅ Review and approve all PRDs
2. Start implementation with PRD-1 (Registry)
3. Use subagent-driven development for parallel work
4. Track progress in project management tool
5. Demo to stakeholders after Phase 1 complete

---

**Last Updated:** 2025-12-30
**Status:** Ready for Implementation
