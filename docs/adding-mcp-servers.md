# Adding MCP Servers to the Registry

This guide explains how to register MCP servers with the registry.

## Context7

[Context7](https://github.com/upstash/context7) provides up-to-date code documentation for LLMs. It fetches version-specific documentation directly from source.

### Endpoint

```
https://mcp.context7.com/mcp
```

### Registration via API

```bash
curl -X POST http://localhost:3000/api/registry/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic YWRtaW46cGFzc3dvcmQ=" \
  -d '{
    "name": "context7",
    "display_name": "Context7",
    "description": "Up-to-date code documentation for LLMs and AI code editors",
    "server_type": "community",
    "endpoint_url": "https://mcp.context7.com/mcp",
    "auth": { "type": "none" },
    "metadata": {
      "author": "Upstash",
      "repository_url": "https://github.com/upstash/context7",
      "documentation_url": "https://context7.com",
      "tags": ["documentation", "libraries", "code-examples"]
    },
    "tools": [
      {
        "name": "resolve-library-id",
        "description": "Resolves a library name to a Context7-compatible library ID",
        "input_schema": {
          "type": "object",
          "properties": {
            "libraryName": { "type": "string" }
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
            "context7CompatibleLibraryID": { "type": "string" },
            "topic": { "type": "string" },
            "tokens": { "type": "number" }
          },
          "required": ["context7CompatibleLibraryID"]
        },
        "category": "documentation"
      }
    ]
  }'
```

### With API Key (Higher Rate Limits)

Get a free API key at [context7.com/dashboard](https://context7.com/dashboard), then register with bearer auth:

```bash
curl -X POST http://localhost:3000/api/registry/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic YWRtaW46cGFzc3dvcmQ=" \
  -d '{
    "name": "context7",
    "display_name": "Context7",
    "description": "Up-to-date code documentation for LLMs",
    "server_type": "community",
    "endpoint_url": "https://mcp.context7.com/mcp",
    "auth": {
      "type": "api_key",
      "token": "YOUR_CONTEXT7_API_KEY"
    },
    ...
  }'
```

---

## JIRA (Atlassian)

There are two options for JIRA MCP integration:

### Option 1: Official Atlassian Rovo MCP Server (Cloud Only)

The [official Atlassian MCP server](https://github.com/atlassian/atlassian-mcp-server) connects Jira and Confluence Cloud securely.

**Requirements:**
- Jira Cloud subscription
- OAuth 2.0 authentication via Atlassian

**Endpoint:**
```
https://mcp.atlassian.com/v1/sse
```

**Registration:**

```bash
curl -X POST http://localhost:3000/api/registry/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic YWRtaW46cGFzc3dvcmQ=" \
  -d '{
    "name": "atlassian-jira",
    "display_name": "Atlassian Jira (Official)",
    "description": "Official Atlassian MCP server for Jira and Confluence Cloud",
    "server_type": "official",
    "endpoint_url": "https://mcp.atlassian.com/v1/sse",
    "auth": {
      "type": "bearer",
      "token": "YOUR_ATLASSIAN_OAUTH_TOKEN"
    },
    "metadata": {
      "author": "Atlassian",
      "repository_url": "https://github.com/atlassian/atlassian-mcp-server",
      "documentation_url": "https://support.atlassian.com/atlassian-rovo-mcp-server/",
      "tags": ["jira", "confluence", "atlassian", "project-management"]
    },
    "tools": [
      {
        "name": "search_issues",
        "description": "Search Jira issues using JQL",
        "input_schema": {
          "type": "object",
          "properties": {
            "jql": { "type": "string", "description": "JQL query" },
            "maxResults": { "type": "number" }
          },
          "required": ["jql"]
        },
        "category": "project-management"
      },
      {
        "name": "get_issue",
        "description": "Get details of a specific Jira issue",
        "input_schema": {
          "type": "object",
          "properties": {
            "issueKey": { "type": "string", "description": "Issue key (e.g., PROJ-123)" }
          },
          "required": ["issueKey"]
        },
        "category": "project-management"
      },
      {
        "name": "create_issue",
        "description": "Create a new Jira issue",
        "input_schema": {
          "type": "object",
          "properties": {
            "projectKey": { "type": "string" },
            "summary": { "type": "string" },
            "description": { "type": "string" },
            "issueType": { "type": "string" }
          },
          "required": ["projectKey", "summary", "issueType"]
        },
        "category": "project-management"
      },
      {
        "name": "update_issue",
        "description": "Update an existing Jira issue",
        "input_schema": {
          "type": "object",
          "properties": {
            "issueKey": { "type": "string" },
            "fields": { "type": "object" }
          },
          "required": ["issueKey", "fields"]
        },
        "category": "project-management"
      }
    ]
  }'
```

### Option 2: Community mcp-atlassian (Cloud + Server/Data Center)

The [mcp-atlassian](https://github.com/sooperset/mcp-atlassian) package supports both Cloud and Server/Data Center deployments.

**Installation (for stdio transport):**
```bash
pip install mcp-atlassian
```

**For HTTP transport**, you need to run it as a server. See the repository for deployment instructions.

**Registration (with Basic Auth for Server/DC):**

```bash
curl -X POST http://localhost:3000/api/registry/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic YWRtaW46cGFzc3dvcmQ=" \
  -d '{
    "name": "jira-community",
    "display_name": "Jira (Community)",
    "description": "Community MCP server for Jira Cloud and Server/Data Center",
    "server_type": "community",
    "endpoint_url": "http://your-mcp-server:8080/mcp",
    "auth": {
      "type": "basic",
      "username": "your-jira-username",
      "password": "your-jira-api-token"
    },
    "metadata": {
      "author": "sooperset",
      "repository_url": "https://github.com/sooperset/mcp-atlassian",
      "tags": ["jira", "confluence", "atlassian"]
    },
    "tools": [
      {
        "name": "jira_search",
        "description": "Search Jira issues using JQL",
        "input_schema": {
          "type": "object",
          "properties": {
            "jql": { "type": "string" },
            "limit": { "type": "number" }
          },
          "required": ["jql"]
        },
        "category": "project-management"
      },
      {
        "name": "jira_get_issue",
        "description": "Get a Jira issue by key",
        "input_schema": {
          "type": "object",
          "properties": {
            "issue_key": { "type": "string" }
          },
          "required": ["issue_key"]
        },
        "category": "project-management"
      }
    ]
  }'
```

---

## Authentication Types

The registry supports these auth types for MCP servers:

| Type | Fields | Use Case |
|------|--------|----------|
| `none` | - | Public servers, no auth needed |
| `basic` | `username`, `password` | Jira Server/DC, self-hosted services |
| `bearer` | `token` | OAuth tokens, JWT |
| `api_key` | `token` | API key in header |

Credentials are encrypted with AES-256-GCM before storage.

---

## Sources

- [Context7 GitHub](https://github.com/upstash/context7)
- [Atlassian MCP Server](https://github.com/atlassian/atlassian-mcp-server)
- [mcp-atlassian (Community)](https://github.com/sooperset/mcp-atlassian)
- [Atlassian Rovo MCP Docs](https://support.atlassian.com/atlassian-rovo-mcp-server/)
