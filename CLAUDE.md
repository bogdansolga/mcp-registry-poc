# CLAUDE.md

This file provides guidance for Claude Code when working on the MCP Registry POC project.

## Project Overview

MCP Registry POC is a Next.js 16 application for discovering and managing Model Context Protocol (MCP) servers. It provides a registry for MCP servers, tool discovery, and a proxy for invoking tools.

## Tech Stack

- **Next.js 16** with App Router and React 19
- **PostgreSQL** with Drizzle ORM
- **Tailwind CSS v4** with shadcn/ui components
- **Biome** for linting and formatting
- **TypeScript** with strict mode

## Key Commands

```bash
pnpm dev              # Development server (port 3000)
pnpm build            # Production build
pnpm lint             # Run Biome linter (auto-fix)
pnpm type-check       # TypeScript checks
pnpm db:push          # Push schema changes to DB
pnpm db:studio        # Open Drizzle Studio
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (all require auth)
│   │   ├── registry/      # CRUD for servers/tools
│   │   ├── proxy/invoke/  # Tool invocation proxy
│   │   └── metrics/       # Health and usage stats
│   └── [pages]/           # UI pages
├── components/
│   ├── ui/                # shadcn components
│   └── registry/          # Domain components
└── lib/
    ├── core/db/           # Drizzle schema and connection
    ├── auth/              # Basic auth middleware
    └── proxy/             # MCP proxy logic
```

## Database

Two PostgreSQL schemas defined in `src/lib/core/db/schema.ts`:

- **registry**: `mcp_servers`, `tools`, `server_metadata`
- **metrics**: `server_health_metrics`, `tool_invocations`

Connection pool configured in `src/lib/core/constants.ts`.

## Authentication

Simple Basic Auth with hardcoded credentials: `admin:password`
- Implementation: `src/lib/auth/basic-auth.ts`
- All API routes are protected
- UI uses 7-day cookie session

## Code Style

- Use Biome for formatting (run `pnpm lint`)
- Prefer named exports
- Use `@/` path alias for imports
- Component files use PascalCase
- API routes return JSON with consistent error format

## API Response Format

Success:
```json
{ "data": {...}, "total": 10 }
```

Error:
```json
{ "error": "Message", "code": "ERROR_CODE" }
```

## Common Tasks

### Adding a new API endpoint
1. Create route file in `src/app/api/[path]/route.ts`
2. Import and use `validateBasicAuth` from `@/lib/auth/basic-auth`
3. Follow existing patterns for request/response handling

### Adding a new UI page
1. Create page in `src/app/[path]/page.tsx`
2. Use existing components from `@/components/ui`
3. Follow existing card/layout patterns

### Modifying database schema
1. Edit `src/lib/core/db/schema.ts`
2. Run `pnpm db:push` to apply changes
3. Update types are auto-inferred from schema

## Environment Variables

Required in `.env`:
```
DATABASE_URL=postgresql://user:password@localhost:5432/mcp_registry
```

## Notes

- Server types: `official`, `community`, `mock`
- Server statuses: `active`, `inactive`, `error`
- Tools have categories for grouping
- Health checks track response time and errors
