# Adding JIRA MCP Server

This guide explains how to integrate JIRA with the MCP Registry.

## Options Overview

| Server | Type | Supports | Transport | Auth |
|--------|------|----------|-----------|------|
| [Atlassian Rovo](https://github.com/atlassian/atlassian-mcp-server) | Official | Cloud only | SSE | OAuth 2.0 |
| [mcp-atlassian](https://github.com/sooperset/mcp-atlassian) | Community | Cloud + Server/DC | stdio/HTTP | Basic/API Key |

## Option 1: Official Atlassian Rovo MCP Server

**Best for:** Jira Cloud users who want official support and security guarantees.

### Prerequisites

1. Jira Cloud subscription
2. OAuth 2.0 token from Atlassian (via [Atlassian Developer Console](https://developer.atlassian.com/console/))

### Endpoint

```
https://mcp.atlassian.com/v1/sse
```

> **Note:** This endpoint uses SSE (Server-Sent Events) transport. See [Compatibility](#compatibility) section.

### Registration

```bash
curl -X POST http://localhost:3000/api/registry/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic YWRtaW46cGFzc3dvcmQ=" \
  -d '{
    "name": "atlassian-jira",
    "display_name": "Atlassian Jira",
    "description": "Official Atlassian MCP server for Jira and Confluence Cloud",
    "server_type": "official",
    "endpoint_url": "https://mcp.atlassian.com/v1/sse",
    "version": "1.0.0",
    "auth": {
      "type": "bearer",
      "token": "YOUR_OAUTH_TOKEN"
    },
    "metadata": {
      "author": "Atlassian",
      "repository_url": "https://github.com/atlassian/atlassian-mcp-server",
      "documentation_url": "https://support.atlassian.com/atlassian-rovo-mcp-server/",
      "tags": ["jira", "confluence", "atlassian", "project-management", "official"]
    },
    "tools": [
      {
        "name": "search_issues",
        "description": "Search Jira issues using JQL query language",
        "input_schema": {
          "type": "object",
          "properties": {
            "jql": { "type": "string", "description": "JQL query string" },
            "maxResults": { "type": "number", "description": "Maximum results to return" },
            "fields": { "type": "array", "items": { "type": "string" }, "description": "Fields to include" }
          },
          "required": ["jql"]
        },
        "category": "project-management"
      },
      {
        "name": "get_issue",
        "description": "Get detailed information about a specific Jira issue",
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
            "projectKey": { "type": "string", "description": "Project key" },
            "summary": { "type": "string", "description": "Issue summary/title" },
            "description": { "type": "string", "description": "Issue description" },
            "issueType": { "type": "string", "description": "Issue type (Bug, Task, Story, etc.)" },
            "priority": { "type": "string", "description": "Priority level" }
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
            "issueKey": { "type": "string", "description": "Issue key to update" },
            "fields": { "type": "object", "description": "Fields to update" }
          },
          "required": ["issueKey", "fields"]
        },
        "category": "project-management"
      },
      {
        "name": "add_comment",
        "description": "Add a comment to a Jira issue",
        "input_schema": {
          "type": "object",
          "properties": {
            "issueKey": { "type": "string" },
            "body": { "type": "string", "description": "Comment text" }
          },
          "required": ["issueKey", "body"]
        },
        "category": "project-management"
      },
      {
        "name": "transition_issue",
        "description": "Transition an issue to a new status",
        "input_schema": {
          "type": "object",
          "properties": {
            "issueKey": { "type": "string" },
            "transitionId": { "type": "string", "description": "Transition ID or name" }
          },
          "required": ["issueKey", "transitionId"]
        },
        "category": "project-management"
      }
    ]
  }'
```

---

## Option 2: Community mcp-atlassian

**Best for:** Jira Server/Data Center users, or Cloud users who prefer self-hosted solutions.

### Prerequisites

1. For **Cloud**: API token from [Atlassian API tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. For **Server/DC**: Username and password with appropriate permissions

### Installation

```bash
# Install the package
pip install mcp-atlassian

# Or with uvx (recommended for MCP)
uvx mcp-atlassian
```

### Running as HTTP Server

To use with the registry proxy, run as an HTTP server:

```bash
# Set environment variables
export JIRA_URL="https://your-company.atlassian.net"
export JIRA_USERNAME="your-email@company.com"
export JIRA_API_TOKEN="your-api-token"

# Run the server (example - check package docs for exact command)
python -m mcp_atlassian.server --transport http --port 8080
```

### Registration (Cloud)

```bash
curl -X POST http://localhost:3000/api/registry/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic YWRtaW46cGFzc3dvcmQ=" \
  -d '{
    "name": "jira-cloud",
    "display_name": "Jira Cloud (Community)",
    "description": "Community MCP server for Jira Cloud",
    "server_type": "community",
    "endpoint_url": "http://localhost:8080/mcp",
    "auth": {
      "type": "api_key",
      "token": "YOUR_JIRA_API_TOKEN"
    },
    "metadata": {
      "author": "sooperset",
      "repository_url": "https://github.com/sooperset/mcp-atlassian",
      "tags": ["jira", "atlassian", "community"]
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
      },
      {
        "name": "jira_create_issue",
        "description": "Create a new Jira issue",
        "input_schema": {
          "type": "object",
          "properties": {
            "project_key": { "type": "string" },
            "summary": { "type": "string" },
            "issue_type": { "type": "string" },
            "description": { "type": "string" }
          },
          "required": ["project_key", "summary", "issue_type"]
        },
        "category": "project-management"
      }
    ]
  }'
```

### Registration (Server/Data Center)

```bash
curl -X POST http://localhost:3000/api/registry/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic YWRtaW46cGFzc3dvcmQ=" \
  -d '{
    "name": "jira-datacenter",
    "display_name": "Jira Data Center",
    "description": "MCP server for Jira Server/Data Center",
    "server_type": "community",
    "endpoint_url": "http://your-mcp-server:8080/mcp",
    "auth": {
      "type": "basic",
      "username": "jira-service-account",
      "password": "your-password"
    },
    "metadata": {
      "author": "sooperset",
      "repository_url": "https://github.com/sooperset/mcp-atlassian",
      "tags": ["jira", "atlassian", "datacenter", "on-premise"]
    },
    "tools": [...]
  }'
```

---

## Compatibility

### Current Registry Support

| Feature | Status | Notes |
|---------|--------|-------|
| JSON-RPC 2.0 | ✅ Implemented | MCP `tools/call` method supported |
| HTTP Transport | ✅ Implemented | Full support for HTTP-based MCP servers |
| SSE Transport | ⚠️ Partial | Direct POST to SSE endpoints; streaming not yet supported |
| OAuth 2.0 flow | ❌ Not implemented | Bearer tokens work, but no OAuth flow UI |

### What Works

- **Registration**: All JIRA servers can be registered in the catalog
- **Discovery**: Tools are discoverable via the registry API
- **Basic/Bearer/API Key Auth**: Credentials are encrypted with AES-256-GCM
- **HTTP Invocation**: Full JSON-RPC 2.0 support for HTTP-based MCP servers
- **SSE Invocation**: Direct POST works for many SSE servers; full streaming pending

### Limitations

- **Official Atlassian SSE endpoint**: May require full streaming SSE for some operations
- **OAuth 2.0**: No built-in OAuth flow; you must obtain tokens externally

See [src/lib/proxy/mcp-proxy.ts](../src/lib/proxy/mcp-proxy.ts) for the transport implementation.

---

## Testing JIRA Integration

### 1. Verify Registration

```bash
curl -s http://localhost:3000/api/registry/servers \
  -H "Authorization: Basic YWRtaW46cGFzc3dvcmQ=" | jq '.data[] | select(.name | contains("jira"))'
```

### 2. Test Tool Discovery

```bash
curl -s "http://localhost:3000/api/registry/categories/project-management/tools" \
  -H "Authorization: Basic YWRtaW46cGFzc3dvcmQ=" | jq
```

### 3. Test Invocation (after proxy enhancement)

```bash
curl -X POST http://localhost:3000/api/proxy/invoke \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic YWRtaW46cGFzc3dvcmQ=" \
  -d '{
    "server_id": 3,
    "tool_name": "search_issues",
    "arguments": {
      "jql": "project = DEMO AND status = Open"
    }
  }'
```

---

## References

- [Atlassian MCP Server (Official)](https://github.com/atlassian/atlassian-mcp-server)
- [mcp-atlassian (Community)](https://github.com/sooperset/mcp-atlassian)
- [Atlassian Rovo MCP Docs](https://support.atlassian.com/atlassian-rovo-mcp-server/)
- [MCP Specification - Tools](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)
- [MCP JSON-RPC Reference](https://portkey.ai/blog/mcp-message-types-complete-json-rpc-reference-guide/)
