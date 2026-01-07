import { ArrowRight, Code, Copy, Key, Server, Wrench } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function CodeBlock({ children, title }: { children: string; title?: string }) {
  return (
    <div className="rounded-lg border bg-slate-950 text-slate-50 overflow-hidden">
      {title && (
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2 text-xs text-slate-400">
          <span>{title}</span>
          <Copy className="h-3.5 w-3.5 cursor-pointer hover:text-slate-200" />
        </div>
      )}
      <pre className="p-4 text-sm overflow-x-auto">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function EndpointCard({
  method,
  path,
  description,
  children,
}: {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  children: React.ReactNode;
}) {
  const methodColors = {
    GET: "bg-green-600",
    POST: "bg-blue-600",
    PUT: "bg-yellow-600",
    DELETE: "bg-red-600",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Badge className={`${methodColors[method]} text-white font-mono`}>{method}</Badge>
          <code className="text-sm font-semibold">{path}</code>
        </div>
        <CardDescription className="mt-2">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen bg-slate-50/50">
      <div className="container py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900">API Documentation</h1>
          <p className="mt-2 text-slate-600">
            Learn how to integrate with the MCP Registry API to discover and invoke MCP tools
          </p>
        </div>

        {/* Quick Start */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Quick Start</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-l-4 border-l-primary">
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Key className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="mt-3 text-lg">1. Authentication</CardTitle>
                <CardDescription>All API requests require Basic Authentication</CardDescription>
              </CardHeader>
              <CardContent>
                <CodeBlock title="Header">{`Authorization: Basic base64(username:password)`}</CodeBlock>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <Server className="h-5 w-5 text-green-600" />
                </div>
                <CardTitle className="mt-3 text-lg">2. Discover Servers</CardTitle>
                <CardDescription>List all registered MCP servers</CardDescription>
              </CardHeader>
              <CardContent>
                <CodeBlock title="Request">{`GET /api/registry/servers`}</CodeBlock>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <Wrench className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="mt-3 text-lg">3. Invoke Tools</CardTitle>
                <CardDescription>Call tools through the proxy API</CardDescription>
              </CardHeader>
              <CardContent>
                <CodeBlock title="Request">{`POST /api/proxy/invoke`}</CodeBlock>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Base URL */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Base URL</h2>
          <Card>
            <CardContent className="pt-6">
              <CodeBlock>{`https://your-registry-domain.com/api`}</CodeBlock>
              <p className="mt-4 text-sm text-muted-foreground">
                For local development, use <code className="bg-muted px-1.5 py-0.5 rounded">http://localhost:3000/api</code>
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Endpoints */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">API Endpoints</h2>
          <div className="space-y-6">
            {/* List Servers */}
            <EndpointCard
              method="GET"
              path="/api/registry/servers"
              description="Retrieve a list of all registered MCP servers with optional filtering"
            >
              <div>
                <h4 className="font-medium mb-2">Query Parameters</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <code className="bg-muted px-1.5 py-0.5 rounded">status</code>
                    <span className="text-muted-foreground">Filter by status: active, inactive, error</span>
                  </div>
                  <div className="flex gap-2">
                    <code className="bg-muted px-1.5 py-0.5 rounded">type</code>
                    <span className="text-muted-foreground">Filter by type: official, community, mock</span>
                  </div>
                  <div className="flex gap-2">
                    <code className="bg-muted px-1.5 py-0.5 rounded">search</code>
                    <span className="text-muted-foreground">Search by server name</span>
                  </div>
                </div>
              </div>
              <CodeBlock title="Response">{`{
  "servers": [
    {
      "id": 1,
      "name": "filesystem-server",
      "display_name": "Filesystem Server",
      "server_type": "official",
      "status": "active",
      "version": "1.0.0",
      "tools_count": 5
    }
  ],
  "total": 1
}`}</CodeBlock>
            </EndpointCard>

            {/* Get Server Details */}
            <EndpointCard
              method="GET"
              path="/api/registry/servers/:id"
              description="Get detailed information about a specific server including all its tools"
            >
              <CodeBlock title="Response">{`{
  "id": 1,
  "name": "filesystem-server",
  "displayName": "Filesystem Server",
  "description": "MCP server for filesystem operations",
  "serverType": "official",
  "status": "active",
  "version": "1.0.0",
  "metadata": {
    "author": "MCP Team",
    "repositoryUrl": "https://github.com/...",
    "tags": ["filesystem", "files"]
  },
  "tools": [
    {
      "id": 1,
      "name": "read_file",
      "description": "Read contents of a file",
      "inputSchema": { ... },
      "category": "filesystem"
    }
  ]
}`}</CodeBlock>
            </EndpointCard>

            {/* Register Server */}
            <EndpointCard
              method="POST"
              path="/api/registry/register"
              description="Register a new MCP server in the registry"
            >
              <CodeBlock title="Request Body">{`{
  "name": "my-mcp-server",
  "display_name": "My MCP Server",
  "description": "A custom MCP server",
  "server_type": "community",
  "endpoint_url": "http://localhost:8080/mcp",
  "version": "1.0.0",
  "metadata": {
    "author": "Your Name",
    "repository_url": "https://github.com/...",
    "tags": ["custom", "tools"]
  },
  "tools": [
    {
      "name": "my_tool",
      "description": "Does something useful",
      "input_schema": {
        "type": "object",
        "properties": {
          "param1": { "type": "string" }
        },
        "required": ["param1"]
      },
      "category": "utility"
    }
  ]
}`}</CodeBlock>
              <CodeBlock title="Response (201 Created)">{`{
  "id": 2,
  "name": "my-mcp-server",
  "status": "active",
  "created_at": "2024-01-15T10:30:00Z"
}`}</CodeBlock>
            </EndpointCard>

            {/* Invoke Tool */}
            <EndpointCard
              method="POST"
              path="/api/proxy/invoke"
              description="Invoke a tool on an MCP server through the registry proxy"
            >
              <CodeBlock title="Request Body">{`{
  "server_id": 1,
  "tool_name": "read_file",
  "arguments": {
    "path": "/path/to/file.txt"
  }
}`}</CodeBlock>
              <CodeBlock title="Success Response">{`{
  "success": true,
  "result": {
    "content": "File contents here..."
  },
  "duration_ms": 45,
  "server_name": "filesystem-server",
  "tool_name": "read_file"
}`}</CodeBlock>
              <CodeBlock title="Error Response">{`{
  "success": false,
  "error": "Tool not found",
  "code": "TOOL_NOT_FOUND"
}`}</CodeBlock>
            </EndpointCard>

            {/* List Categories */}
            <EndpointCard
              method="GET"
              path="/api/registry/categories"
              description="Get all tool categories with their tool counts"
            >
              <CodeBlock title="Response">{`{
  "categories": [
    { "name": "filesystem", "tool_count": 5 },
    { "name": "database", "tool_count": 3 }
  ],
  "total": 2
}`}</CodeBlock>
            </EndpointCard>

            {/* Category Tools */}
            <EndpointCard
              method="GET"
              path="/api/registry/categories/:category/tools"
              description="Get all tools in a specific category"
            >
              <CodeBlock title="Response">{`{
  "category": "filesystem",
  "tools": [
    {
      "id": 1,
      "name": "read_file",
      "description": "Read file contents",
      "server_name": "filesystem-server",
      "server_id": 1
    }
  ],
  "total": 1
}`}</CodeBlock>
            </EndpointCard>
          </div>
        </section>

        {/* Error Codes */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Error Codes</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Code</th>
                      <th className="text-left py-3 px-4 font-medium">HTTP Status</th>
                      <th className="text-left py-3 px-4 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 px-4"><code>UNAUTHORIZED</code></td>
                      <td className="py-3 px-4">401</td>
                      <td className="py-3 px-4 text-muted-foreground">Invalid or missing credentials</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4"><code>VALIDATION_ERROR</code></td>
                      <td className="py-3 px-4">400</td>
                      <td className="py-3 px-4 text-muted-foreground">Invalid request parameters or body</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4"><code>SERVER_NOT_FOUND</code></td>
                      <td className="py-3 px-4">404</td>
                      <td className="py-3 px-4 text-muted-foreground">MCP server not found in registry</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4"><code>TOOL_NOT_FOUND</code></td>
                      <td className="py-3 px-4">404</td>
                      <td className="py-3 px-4 text-muted-foreground">Tool not found on the server</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4"><code>DUPLICATE_SERVER</code></td>
                      <td className="py-3 px-4">409</td>
                      <td className="py-3 px-4 text-muted-foreground">Server name already exists</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4"><code>INVOCATION_ERROR</code></td>
                      <td className="py-3 px-4">502</td>
                      <td className="py-3 px-4 text-muted-foreground">Error invoking the MCP server</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4"><code>INTERNAL_ERROR</code></td>
                      <td className="py-3 px-4">500</td>
                      <td className="py-3 px-4 text-muted-foreground">Internal server error</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Example Integration */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Example: JavaScript Integration</h2>
          <Card>
            <CardContent className="pt-6">
              <CodeBlock title="example.js">{`// Configure authentication
const BASE_URL = 'http://localhost:3000/api';
const AUTH = btoa('admin:password');

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const response = await fetch(\`\${BASE_URL}\${endpoint}\`, {
    ...options,
    headers: {
      'Authorization': \`Basic \${AUTH}\`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return response.json();
}

// List all servers
const servers = await apiCall('/registry/servers');
console.log('Available servers:', servers);

// Get server details
const server = await apiCall('/registry/servers/1');
console.log('Server tools:', server.tools);

// Invoke a tool
const result = await apiCall('/proxy/invoke', {
  method: 'POST',
  body: JSON.stringify({
    server_id: 1,
    tool_name: 'read_file',
    arguments: { path: '/tmp/example.txt' }
  })
});
console.log('Tool result:', result);`}</CodeBlock>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <section>
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="py-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-xl font-bold">Ready to get started?</h3>
                  <p className="mt-1 text-primary-foreground/80">
                    Browse available servers or register your own MCP server
                  </p>
                </div>
                <div className="flex gap-4">
                  <Link
                    href="/registry"
                    className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-primary hover:bg-white/90"
                  >
                    Browse Registry
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 rounded-md bg-primary-foreground/10 px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-foreground/20"
                  >
                    Register Server
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
