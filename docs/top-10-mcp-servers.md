# Top 10 MCP Servers Registration Guide

This guide shows how to register the most popular MCP servers with the registry, both via the UI and the API.

## Overview

| # | Server | Category | Transport | Auth Required |
|---|--------|----------|-----------|---------------|
| 1 | [Filesystem](#1-filesystem) | File Operations | HTTP | No |
| 2 | [GitHub](#2-github) | Version Control | HTTP | API Token |
| 3 | [Brave Search](#3-brave-search) | Web Search | HTTP | API Key |
| 4 | [Context7](#4-context7) | Documentation | HTTP | Optional |
| 5 | [Memory](#5-memory) | Knowledge Graph | HTTP | No |
| 6 | [PostgreSQL](#6-postgresql) | Database | HTTP | Connection String |
| 7 | [Slack](#7-slack) | Communication | HTTP | Bot Token |
| 8 | [Google Drive](#8-google-drive) | File Storage | HTTP | OAuth |
| 9 | [Puppeteer](#9-puppeteer) | Browser Automation | HTTP | No |
| 10 | [Sequential Thinking](#10-sequential-thinking) | Reasoning | HTTP | No |

---

## Manual Registration (UI)

1. Navigate to http://localhost:3000/register
2. Fill in the server details
3. Add tools with their input schemas
4. Click "Register Server"

---

## API Registration

All examples use Basic Auth: `admin:password` (base64: `YWRtaW46cGFzc3dvcmQ=`)

---

## 1. Filesystem

Secure file operations with configurable access controls.

**Source:** [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem)

```bash
curl -X POST http://localhost:3000/api/registry/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic YWRtaW46cGFzc3dvcmQ=" \
  -d '{
    "name": "filesystem",
    "display_name": "Filesystem",
    "description": "Secure file operations with configurable access controls for reading, writing, and managing files",
    "server_type": "official",
    "endpoint_url": "http://localhost:8100/mcp",
    "auth": { "type": "none" },
    "metadata": {
      "author": "Anthropic",
      "repository_url": "https://github.com/modelcontextprotocol/servers",
      "documentation_url": "https://modelcontextprotocol.io/examples",
      "tags": ["filesystem", "files", "directories", "official"]
    },
    "tools": [
      {
        "name": "read_file",
        "description": "Read the complete contents of a file",
        "input_schema": {
          "type": "object",
          "properties": {
            "path": { "type": "string", "description": "Path to the file to read" }
          },
          "required": ["path"]
        },
        "category": "filesystem"
      },
      {
        "name": "write_file",
        "description": "Write content to a file (creates or overwrites)",
        "input_schema": {
          "type": "object",
          "properties": {
            "path": { "type": "string", "description": "Path to the file to write" },
            "content": { "type": "string", "description": "Content to write" }
          },
          "required": ["path", "content"]
        },
        "category": "filesystem"
      },
      {
        "name": "list_directory",
        "description": "List contents of a directory",
        "input_schema": {
          "type": "object",
          "properties": {
            "path": { "type": "string", "description": "Path to the directory" }
          },
          "required": ["path"]
        },
        "category": "filesystem"
      },
      {
        "name": "search_files",
        "description": "Search for files matching a pattern",
        "input_schema": {
          "type": "object",
          "properties": {
            "path": { "type": "string", "description": "Starting directory" },
            "pattern": { "type": "string", "description": "Glob pattern to match" }
          },
          "required": ["path", "pattern"]
        },
        "category": "filesystem"
      }
    ]
  }'
```

---

## 2. GitHub

Repository management, issues, pull requests, and code search.

**Source:** [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/github)

```bash
curl -X POST http://localhost:3000/api/registry/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic YWRtaW46cGFzc3dvcmQ=" \
  -d '{
    "name": "github",
    "display_name": "GitHub",
    "description": "GitHub API integration for repository management, issues, pull requests, and code operations",
    "server_type": "official",
    "endpoint_url": "http://localhost:8101/mcp",
    "auth": {
      "type": "bearer",
      "token": "YOUR_GITHUB_TOKEN"
    },
    "metadata": {
      "author": "Anthropic",
      "repository_url": "https://github.com/modelcontextprotocol/servers",
      "documentation_url": "https://modelcontextprotocol.io/examples",
      "tags": ["github", "git", "version-control", "official"]
    },
    "tools": [
      {
        "name": "search_repositories",
        "description": "Search for GitHub repositories",
        "input_schema": {
          "type": "object",
          "properties": {
            "query": { "type": "string", "description": "Search query" },
            "page": { "type": "number" },
            "perPage": { "type": "number" }
          },
          "required": ["query"]
        },
        "category": "version-control"
      },
      {
        "name": "get_file_contents",
        "description": "Get contents of a file from a repository",
        "input_schema": {
          "type": "object",
          "properties": {
            "owner": { "type": "string" },
            "repo": { "type": "string" },
            "path": { "type": "string" },
            "branch": { "type": "string" }
          },
          "required": ["owner", "repo", "path"]
        },
        "category": "version-control"
      },
      {
        "name": "create_issue",
        "description": "Create a new issue in a repository",
        "input_schema": {
          "type": "object",
          "properties": {
            "owner": { "type": "string" },
            "repo": { "type": "string" },
            "title": { "type": "string" },
            "body": { "type": "string" },
            "labels": { "type": "array", "items": { "type": "string" } }
          },
          "required": ["owner", "repo", "title"]
        },
        "category": "version-control"
      },
      {
        "name": "create_pull_request",
        "description": "Create a new pull request",
        "input_schema": {
          "type": "object",
          "properties": {
            "owner": { "type": "string" },
            "repo": { "type": "string" },
            "title": { "type": "string" },
            "body": { "type": "string" },
            "head": { "type": "string" },
            "base": { "type": "string" }
          },
          "required": ["owner", "repo", "title", "head", "base"]
        },
        "category": "version-control"
      }
    ]
  }'
```

---

## 3. Brave Search

Web and local search using Brave's privacy-focused Search API.

**Source:** [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search)

```bash
curl -X POST http://localhost:3000/api/registry/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic YWRtaW46cGFzc3dvcmQ=" \
  -d '{
    "name": "brave-search",
    "display_name": "Brave Search",
    "description": "Web and local search using Brave Search API with privacy focus",
    "server_type": "official",
    "endpoint_url": "http://localhost:8102/mcp",
    "auth": {
      "type": "api_key",
      "token": "YOUR_BRAVE_API_KEY"
    },
    "metadata": {
      "author": "Anthropic",
      "repository_url": "https://github.com/modelcontextprotocol/servers",
      "documentation_url": "https://brave.com/search/api/",
      "tags": ["search", "web", "brave", "privacy", "official"]
    },
    "tools": [
      {
        "name": "brave_web_search",
        "description": "Search the web using Brave Search",
        "input_schema": {
          "type": "object",
          "properties": {
            "query": { "type": "string", "description": "Search query" },
            "count": { "type": "number", "description": "Number of results (max 20)" }
          },
          "required": ["query"]
        },
        "category": "search"
      },
      {
        "name": "brave_local_search",
        "description": "Search for local businesses and places",
        "input_schema": {
          "type": "object",
          "properties": {
            "query": { "type": "string", "description": "Local search query" },
            "count": { "type": "number" }
          },
          "required": ["query"]
        },
        "category": "search"
      }
    ]
  }'
```

**Get API Key:** [Brave Search API](https://brave.com/search/api/) - Free tier: 2,000 queries/month

---

## 4. Context7

Up-to-date code documentation for LLMs from library source.

**Source:** [upstash/context7](https://github.com/upstash/context7)

```bash
curl -X POST http://localhost:3000/api/registry/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic YWRtaW46cGFzc3dvcmQ=" \
  -d '{
    "name": "context7",
    "display_name": "Context7",
    "description": "Up-to-date code documentation for LLMs, fetching version-specific docs directly from source",
    "server_type": "community",
    "endpoint_url": "https://mcp.context7.com/mcp",
    "auth": { "type": "none" },
    "metadata": {
      "author": "Upstash",
      "repository_url": "https://github.com/upstash/context7",
      "documentation_url": "https://context7.com",
      "tags": ["documentation", "libraries", "code-examples", "llm"]
    },
    "tools": [
      {
        "name": "resolve-library-id",
        "description": "Resolves a library name to a Context7-compatible library ID",
        "input_schema": {
          "type": "object",
          "properties": {
            "libraryName": { "type": "string", "description": "Library name (e.g., react, nextjs)" }
          },
          "required": ["libraryName"]
        },
        "category": "documentation"
      },
      {
        "name": "get-library-docs",
        "description": "Fetches up-to-date documentation for a library",
        "input_schema": {
          "type": "object",
          "properties": {
            "context7CompatibleLibraryID": { "type": "string", "description": "Library ID from resolve-library-id" },
            "topic": { "type": "string", "description": "Topic to focus on" },
            "tokens": { "type": "number", "description": "Max tokens to return" }
          },
          "required": ["context7CompatibleLibraryID"]
        },
        "category": "documentation"
      }
    ]
  }'
```

**Optional API Key:** [context7.com/dashboard](https://context7.com/dashboard) for higher rate limits

---

## 5. Memory

Knowledge graph-based persistent memory system.

**Source:** [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/memory)

```bash
curl -X POST http://localhost:3000/api/registry/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic YWRtaW46cGFzc3dvcmQ=" \
  -d '{
    "name": "memory",
    "display_name": "Memory",
    "description": "Knowledge graph-based persistent memory for storing entities, relations, and observations",
    "server_type": "official",
    "endpoint_url": "http://localhost:8103/mcp",
    "auth": { "type": "none" },
    "metadata": {
      "author": "Anthropic",
      "repository_url": "https://github.com/modelcontextprotocol/servers",
      "tags": ["memory", "knowledge-graph", "persistence", "official"]
    },
    "tools": [
      {
        "name": "create_entities",
        "description": "Create multiple new entities in the knowledge graph",
        "input_schema": {
          "type": "object",
          "properties": {
            "entities": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "name": { "type": "string" },
                  "entityType": { "type": "string" },
                  "observations": { "type": "array", "items": { "type": "string" } }
                }
              }
            }
          },
          "required": ["entities"]
        },
        "category": "memory"
      },
      {
        "name": "search_nodes",
        "description": "Search for nodes in the knowledge graph",
        "input_schema": {
          "type": "object",
          "properties": {
            "query": { "type": "string", "description": "Search query" }
          },
          "required": ["query"]
        },
        "category": "memory"
      },
      {
        "name": "create_relations",
        "description": "Create relations between entities",
        "input_schema": {
          "type": "object",
          "properties": {
            "relations": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "from": { "type": "string" },
                  "to": { "type": "string" },
                  "relationType": { "type": "string" }
                }
              }
            }
          },
          "required": ["relations"]
        },
        "category": "memory"
      }
    ]
  }'
```

---

## 6. PostgreSQL

Database operations and query execution.

**Source:** [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/postgres)

```bash
curl -X POST http://localhost:3000/api/registry/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic YWRtaW46cGFzc3dvcmQ=" \
  -d '{
    "name": "postgresql",
    "display_name": "PostgreSQL",
    "description": "PostgreSQL database operations including queries, schema inspection, and data manipulation",
    "server_type": "official",
    "endpoint_url": "http://localhost:8104/mcp",
    "auth": {
      "type": "basic",
      "username": "postgres",
      "password": "YOUR_DB_PASSWORD"
    },
    "metadata": {
      "author": "Anthropic",
      "repository_url": "https://github.com/modelcontextprotocol/servers",
      "tags": ["database", "postgresql", "sql", "official"]
    },
    "tools": [
      {
        "name": "query",
        "description": "Execute a read-only SQL query",
        "input_schema": {
          "type": "object",
          "properties": {
            "sql": { "type": "string", "description": "SQL query to execute" }
          },
          "required": ["sql"]
        },
        "category": "database"
      },
      {
        "name": "list_tables",
        "description": "List all tables in the database",
        "input_schema": {
          "type": "object",
          "properties": {
            "schema": { "type": "string", "description": "Schema name (default: public)" }
          }
        },
        "category": "database"
      },
      {
        "name": "describe_table",
        "description": "Get the schema of a specific table",
        "input_schema": {
          "type": "object",
          "properties": {
            "table": { "type": "string", "description": "Table name" },
            "schema": { "type": "string" }
          },
          "required": ["table"]
        },
        "category": "database"
      }
    ]
  }'
```

---

## 7. Slack

Slack workspace integration for messaging and channel management.

**Source:** [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/slack)

```bash
curl -X POST http://localhost:3000/api/registry/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic YWRtaW46cGFzc3dvcmQ=" \
  -d '{
    "name": "slack",
    "display_name": "Slack",
    "description": "Slack workspace integration for messaging, channels, and user management",
    "server_type": "official",
    "endpoint_url": "http://localhost:8105/mcp",
    "auth": {
      "type": "bearer",
      "token": "xoxb-YOUR-SLACK-BOT-TOKEN"
    },
    "metadata": {
      "author": "Anthropic",
      "repository_url": "https://github.com/modelcontextprotocol/servers",
      "tags": ["slack", "messaging", "communication", "official"]
    },
    "tools": [
      {
        "name": "list_channels",
        "description": "List all channels in the workspace",
        "input_schema": {
          "type": "object",
          "properties": {
            "limit": { "type": "number" },
            "cursor": { "type": "string" }
          }
        },
        "category": "communication"
      },
      {
        "name": "post_message",
        "description": "Post a message to a channel",
        "input_schema": {
          "type": "object",
          "properties": {
            "channel": { "type": "string", "description": "Channel ID or name" },
            "text": { "type": "string", "description": "Message text" }
          },
          "required": ["channel", "text"]
        },
        "category": "communication"
      },
      {
        "name": "get_channel_history",
        "description": "Get message history from a channel",
        "input_schema": {
          "type": "object",
          "properties": {
            "channel": { "type": "string" },
            "limit": { "type": "number" }
          },
          "required": ["channel"]
        },
        "category": "communication"
      }
    ]
  }'
```

**Setup:** Create a Slack App at [api.slack.com/apps](https://api.slack.com/apps)

---

## 8. Google Drive

Google Drive file access and management.

**Source:** [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/gdrive)

```bash
curl -X POST http://localhost:3000/api/registry/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic YWRtaW46cGFzc3dvcmQ=" \
  -d '{
    "name": "google-drive",
    "display_name": "Google Drive",
    "description": "Google Drive file access, search, and management",
    "server_type": "official",
    "endpoint_url": "http://localhost:8106/mcp",
    "auth": {
      "type": "bearer",
      "token": "YOUR_GOOGLE_OAUTH_TOKEN"
    },
    "metadata": {
      "author": "Anthropic",
      "repository_url": "https://github.com/modelcontextprotocol/servers",
      "tags": ["google-drive", "files", "storage", "official"]
    },
    "tools": [
      {
        "name": "search_files",
        "description": "Search for files in Google Drive",
        "input_schema": {
          "type": "object",
          "properties": {
            "query": { "type": "string", "description": "Search query" }
          },
          "required": ["query"]
        },
        "category": "storage"
      },
      {
        "name": "read_file",
        "description": "Read contents of a file from Google Drive",
        "input_schema": {
          "type": "object",
          "properties": {
            "fileId": { "type": "string", "description": "Google Drive file ID" }
          },
          "required": ["fileId"]
        },
        "category": "storage"
      }
    ]
  }'
```

**Setup:** OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/)

---

## 9. Puppeteer

Browser automation for web scraping and testing.

**Source:** [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer)

```bash
curl -X POST http://localhost:3000/api/registry/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic YWRtaW46cGFzc3dvcmQ=" \
  -d '{
    "name": "puppeteer",
    "display_name": "Puppeteer",
    "description": "Browser automation for web scraping, screenshots, and testing",
    "server_type": "official",
    "endpoint_url": "http://localhost:8107/mcp",
    "auth": { "type": "none" },
    "metadata": {
      "author": "Anthropic",
      "repository_url": "https://github.com/modelcontextprotocol/servers",
      "tags": ["browser", "automation", "scraping", "puppeteer", "official"]
    },
    "tools": [
      {
        "name": "navigate",
        "description": "Navigate to a URL",
        "input_schema": {
          "type": "object",
          "properties": {
            "url": { "type": "string", "description": "URL to navigate to" }
          },
          "required": ["url"]
        },
        "category": "browser"
      },
      {
        "name": "screenshot",
        "description": "Take a screenshot of the current page",
        "input_schema": {
          "type": "object",
          "properties": {
            "name": { "type": "string", "description": "Screenshot filename" },
            "selector": { "type": "string", "description": "CSS selector for element screenshot" }
          },
          "required": ["name"]
        },
        "category": "browser"
      },
      {
        "name": "click",
        "description": "Click an element on the page",
        "input_schema": {
          "type": "object",
          "properties": {
            "selector": { "type": "string", "description": "CSS selector of element to click" }
          },
          "required": ["selector"]
        },
        "category": "browser"
      },
      {
        "name": "evaluate",
        "description": "Execute JavaScript in the browser",
        "input_schema": {
          "type": "object",
          "properties": {
            "script": { "type": "string", "description": "JavaScript to execute" }
          },
          "required": ["script"]
        },
        "category": "browser"
      }
    ]
  }'
```

---

## 10. Sequential Thinking

Dynamic problem-solving through structured thought sequences.

**Source:** [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking)

```bash
curl -X POST http://localhost:3000/api/registry/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic YWRtaW46cGFzc3dvcmQ=" \
  -d '{
    "name": "sequential-thinking",
    "display_name": "Sequential Thinking",
    "description": "Dynamic and reflective problem-solving through structured thought sequences",
    "server_type": "official",
    "endpoint_url": "http://localhost:8108/mcp",
    "auth": { "type": "none" },
    "metadata": {
      "author": "Anthropic",
      "repository_url": "https://github.com/modelcontextprotocol/servers",
      "tags": ["reasoning", "problem-solving", "thinking", "official"]
    },
    "tools": [
      {
        "name": "sequentialthinking",
        "description": "Solve problems through structured sequential thinking",
        "input_schema": {
          "type": "object",
          "properties": {
            "thought": { "type": "string", "description": "Current thinking step" },
            "nextThoughtNeeded": { "type": "boolean" },
            "thoughtNumber": { "type": "number" },
            "totalThoughts": { "type": "number" },
            "isRevision": { "type": "boolean" },
            "revisesThought": { "type": "number" },
            "branchFromThought": { "type": "number" },
            "branchId": { "type": "string" },
            "needsMoreThoughts": { "type": "boolean" }
          },
          "required": ["thought", "nextThoughtNeeded", "thoughtNumber", "totalThoughts"]
        },
        "category": "reasoning"
      }
    ]
  }'
```

---

## Batch Registration Script

Register all 10 servers at once (update tokens/passwords first):

```bash
#!/bin/bash

AUTH="Authorization: Basic YWRtaW46cGFzc3dvcmQ="
API="http://localhost:3000/api/registry/register"

# Array of server JSON files or inline definitions
# Save each server JSON above to a file, then:

for server in filesystem github brave-search context7 memory postgresql slack google-drive puppeteer sequential-thinking; do
  echo "Registering $server..."
  curl -s -X POST "$API" \
    -H "Content-Type: application/json" \
    -H "$AUTH" \
    -d @"servers/${server}.json" | jq -r '.name // .error'
done
```

---

## Running MCP Servers Locally

Most official MCP servers can be run using npx:

```bash
# Filesystem (set allowed directories)
npx -y @modelcontextprotocol/server-filesystem /path/to/allowed

# GitHub (set token)
GITHUB_PERSONAL_ACCESS_TOKEN=your-token npx -y @modelcontextprotocol/server-github

# Brave Search
BRAVE_API_KEY=your-key npx -y @modelcontextprotocol/server-brave-search

# Memory
npx -y @modelcontextprotocol/server-memory

# PostgreSQL
DATABASE_URL=postgresql://... npx -y @modelcontextprotocol/server-postgres

# Sequential Thinking
npx -y @modelcontextprotocol/server-sequentialthinking
```

To expose as HTTP servers for the registry proxy, wrap with an HTTP adapter or use the MCP HTTP transport directly.

---

## References

- [Official MCP Servers](https://github.com/modelcontextprotocol/servers)
- [MCP Examples](https://modelcontextprotocol.io/examples)
- [Awesome MCP Servers](https://github.com/wong2/awesome-mcp-servers)
- [Top 10 MCP Servers 2025](https://dev.to/fallon_jimmy/top-10-mcp-servers-for-2025-yes-githubs-included-15jg)
