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

### Current Registry Limitations

The MCP Registry proxy currently has limitations with standard MCP protocol:

| Feature | Status | Notes |
|---------|--------|-------|
| HTTP Streamable Transport | ⚠️ Partial | Custom `/invoke` endpoint, not JSON-RPC |
| SSE Transport | ❌ Not supported | Required for official Atlassian server |
| JSON-RPC 2.0 | ❌ Not implemented | MCP spec requires `tools/call` method |
| OAuth 2.0 flow | ❌ Not implemented | Bearer tokens work, but no OAuth flow |

### What Works Now

- **Registration**: All JIRA servers can be registered in the catalog
- **Discovery**: Tools are discoverable via the registry API
- **Basic/Bearer Auth**: Credentials are encrypted and stored securely

### What Needs Enhancement

To fully support JIRA MCP servers via proxy invocation, the registry needs:

1. **JSON-RPC 2.0 support** - Send `tools/call` requests per MCP spec
2. **SSE transport** - For official Atlassian endpoint
3. **Response parsing** - Handle MCP response format with `content` array

See the [implementation diff](#required-code-changes) below.

---

## Required Code Changes

To support standard MCP protocol (including JIRA), apply these changes to `src/lib/proxy/mcp-proxy.ts`:

```diff
--- a/src/lib/proxy/mcp-proxy.ts
+++ b/src/lib/proxy/mcp-proxy.ts
@@ -40,6 +40,9 @@ export interface AuthParams {

 const DEFAULT_TIMEOUT_MS = 10000; // 10 seconds

+// Request ID counter for JSON-RPC
+let jsonRpcIdCounter = 1;
+
 // Common stdio transport indicators in endpoint URLs
 const STDIO_INDICATORS = ["stdio://", "npx ", "node ", "python ", "uvx "];

@@ -50,6 +53,11 @@ function isStdioTransport(endpointUrl: string): boolean {
   return STDIO_INDICATORS.some((indicator) => lowerUrl.includes(indicator.toLowerCase()));
 }

+/** Detects if the endpoint uses SSE transport */
+function isSseTransport(endpointUrl: string): boolean {
+  return endpointUrl.includes("/sse");
+}
+
 /** Builds authentication headers based on auth type */
 function buildAuthHeaders(auth: AuthParams): Record<string, string> {
   const headers: Record<string, string> = {};
@@ -146,6 +154,100 @@ function extractServerAuth(server: {
 }

 /**
+ * Makes a JSON-RPC 2.0 request to invoke a tool per MCP specification
+ */
+async function invokeMcpTool(
+  endpointUrl: string,
+  toolName: string,
+  args: Record<string, unknown>,
+  timeoutMs: number = DEFAULT_TIMEOUT_MS,
+  auth?: AuthParams,
+): Promise<{ success: boolean; result?: unknown; error?: string }> {
+  const controller = new AbortController();
+  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
+
+  try {
+    // Build headers with auth
+    const headers: Record<string, string> = {
+      "Content-Type": "application/json",
+    };
+
+    if (auth) {
+      Object.assign(headers, buildAuthHeaders(auth));
+    }
+
+    // JSON-RPC 2.0 request per MCP specification
+    const jsonRpcRequest = {
+      jsonrpc: "2.0",
+      id: jsonRpcIdCounter++,
+      method: "tools/call",
+      params: {
+        name: toolName,
+        arguments: args,
+      },
+    };
+
+    logger.debug(`MCP tools/call: ${toolName} at ${endpointUrl}`);
+
+    const response = await fetch(endpointUrl, {
+      method: "POST",
+      headers,
+      body: JSON.stringify(jsonRpcRequest),
+      signal: controller.signal,
+    });
+
+    clearTimeout(timeoutId);
+
+    if (!response.ok) {
+      const errorText = await response.text().catch(() => "Unknown error");
+      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
+    }
+
+    const jsonRpcResponse = await response.json();
+
+    // Handle JSON-RPC error
+    if (jsonRpcResponse.error) {
+      return {
+        success: false,
+        error: jsonRpcResponse.error.message || "JSON-RPC error",
+      };
+    }
+
+    // Extract result - MCP returns content array
+    const result = jsonRpcResponse.result;
+
+    // Check for tool error in result
+    if (result?.isError) {
+      const errorContent = result.content?.find((c: { type: string }) => c.type === "text");
+      return {
+        success: false,
+        error: errorContent?.text || "Tool execution error",
+      };
+    }
+
+    return { success: true, result };
+  } catch (error) {
+    clearTimeout(timeoutId);
+
+    if (error instanceof Error) {
+      if (error.name === "AbortError") {
+        return { success: false, error: `Request timeout after ${timeoutMs}ms` };
+      }
+      return { success: false, error: error.message };
+    }
+
+    return { success: false, error: "Unknown error during MCP invocation" };
+  }
+}
+
+/**
+ * Invokes a tool via SSE transport (for servers like Atlassian)
+ */
+async function invokeSseTool(
+  endpointUrl: string,
+  toolName: string,
+  args: Record<string, unknown>,
+  timeoutMs: number = DEFAULT_TIMEOUT_MS,
+  auth?: AuthParams,
+): Promise<{ success: boolean; result?: unknown; error?: string }> {
+  // SSE transport requires establishing a connection and sending messages
+  // This is a placeholder - full implementation requires EventSource handling
+  return {
+    success: false,
+    error: "SSE transport not yet implemented. Use HTTP transport or connect directly.",
+  };
+}
+
+/**
  * Makes an HTTP request to an MCP server to invoke a tool
+ * @deprecated Use invokeMcpTool for standard MCP servers
  */
 async function invokeHttpTool(
   endpointUrl: string,
@@ -277,11 +379,21 @@ export async function invokeToolProxy(request: ProxyRequest): Promise<ProxyResul
     // 4. Extract and decrypt server credentials for auth
     const auth = extractServerAuth(server);

-    // 5. Forward the request to the MCP server
-    const invocationResult = await invokeHttpTool(
+    // 5. Determine transport and invoke
+    let invocationResult: { success: boolean; result?: unknown; error?: string };
+
+    if (isSseTransport(server.endpointUrl)) {
+      // SSE transport (e.g., Atlassian)
+      invocationResult = await invokeSseTool(
+        server.endpointUrl, request.toolName, request.arguments, DEFAULT_TIMEOUT_MS, auth
+      );
+    } else {
+      // HTTP transport with JSON-RPC
+      invocationResult = await invokeMcpTool(
       server.endpointUrl,
       request.toolName,
       request.arguments,
       DEFAULT_TIMEOUT_MS,
       auth,
     );
+    }

     const durationMs = Date.now() - startTime;
```

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
