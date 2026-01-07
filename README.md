# MCP Registry POC

A proof-of-concept web application for discovering, registering, and managing Model Context Protocol (MCP) servers. Built with Next.js 16, PostgreSQL, and Drizzle ORM.

## Features

- **Server Registry**: Register and browse MCP servers with metadata, tools, and health status
- **Tool Discovery**: Browse tools by category, search, and filter by server type/status
- **Tool Invocation**: Invoke MCP tools directly through a proxy API with metrics tracking
- **Health Monitoring**: Automated health checks with response time tracking
- **API Documentation**: Comprehensive API docs at `/api-docs`
- **Dashboard**: Real-time stats and server overview

## Tech Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **Auth**: Basic Authentication (admin:password)
- **Linting**: Biome

## Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL 15+

## Getting Started

### 1. Clone and Install

```bash
git clone git@github.com:N-iX-GenAI-Value-LAB/mcp-registry-poc.git
cd mcp-registry-poc
pnpm install
```

### 2. Database Setup

Create a `.env` file:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/mcp_registry
```

Run the database setup script:

```bash
./scripts/db/setup-database.sh
```

Or manually push the schema:

```bash
pnpm db:push
```

### 3. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── registry/      # Server/tool CRUD endpoints
│   │   ├── proxy/         # Tool invocation proxy
│   │   ├── metrics/       # Health and usage metrics
│   │   └── jobs/          # Background job endpoints
│   ├── api-docs/          # API documentation page
│   ├── categories/        # Category browsing pages
│   ├── register/          # Server registration form
│   └── registry/          # Server browser and detail pages
├── components/
│   ├── registration/      # Server registration form
│   ├── registry/          # Registry browser components
│   └── ui/                # shadcn/ui components
└── lib/
    ├── auth/              # Basic authentication
    ├── core/              # Database, constants, utilities
    ├── jobs/              # Health check job
    └── proxy/             # MCP proxy implementation
```

## Database Schema

Two PostgreSQL schemas:

### Registry Schema
- `mcp_servers` - Server registration (name, endpoint, type, status)
- `tools` - Tool definitions with input schemas
- `server_metadata` - Author, repository, tags

### Metrics Schema
- `server_health_metrics` - Health check results
- `tool_invocations` - Tool usage tracking

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/registry/servers` | List all servers |
| GET | `/api/registry/servers/:id` | Get server details |
| POST | `/api/registry/register` | Register new server |
| GET | `/api/registry/categories` | List categories |
| GET | `/api/registry/categories/:category/tools` | Tools by category |
| POST | `/api/proxy/invoke` | Invoke a tool |
| GET | `/api/metrics/health` | Health status |

See `/api-docs` for full documentation.

## Scripts

```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run Biome linter
pnpm type-check       # TypeScript type checking
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Drizzle Studio
pnpm db:dump          # Dump database
pnpm db:restore       # Restore database
```

## Authentication

Default credentials: `admin:password`

All API endpoints require Basic Authentication header:
```
Authorization: Basic YWRtaW46cGFzc3dvcmQ=
```

## License

MIT
