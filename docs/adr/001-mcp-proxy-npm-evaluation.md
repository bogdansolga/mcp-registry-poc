# ADR-001: Evaluation of mcp-proxy npm Library

**Status:** Accepted
**Date:** 2026-01-16
**Decision Makers:** Development Team

## Context

We evaluated whether the [`mcp-proxy`](https://github.com/punkpeye/mcp-proxy) npm library would benefit our MCP Registry POC project, which includes a custom proxy implementation for invoking tools on registered MCP servers.

## Decision

**We will not adopt the `mcp-proxy` npm library** as it solves a different problem than our implementation.

## Comparison

| Aspect | `mcp-proxy` npm | Our `mcp-proxy.ts` |
|--------|-----------------|---------------------|
| **Purpose** | Converts **stdio** MCP servers → HTTP/SSE endpoints | Forwards requests to **already-HTTP** MCP servers |
| **Direction** | Server wrapper (exposes local servers) | Client proxy (routes to remote servers) |
| **Use case** | "I have a stdio MCP server, make it HTTP-accessible" | "I have HTTP MCP servers registered, proxy calls to them" |
| **Session management** | Yes (maintains stdio process sessions) | No (stateless request forwarding) |

## Rationale

1. **Different problem domains**: The npm `mcp-proxy` wraps stdio-based MCP servers to expose them over HTTP/SSE. Our implementation proxies requests to already-HTTP-accessible MCP servers registered in our database.

2. **Our proxy's responsibilities** include:
   - Database lookup for server configuration
   - Authentication credential decryption and forwarding
   - Transport detection (HTTP/SSE) and appropriate handling
   - Metrics recording for invocations
   - Correctly rejecting stdio transports with helpful error messages

3. **Architectural fit**: Our registry **references** MCP servers rather than **hosts** them. The npm library would only add value if we wanted to spawn and manage stdio MCP server processes ourselves.

## Consequences

- **Positive**: We maintain a focused, purpose-built proxy that integrates with our registry's database and metrics systems.
- **Positive**: No additional dependency for functionality we don't need.
- **Neutral**: Stdio-based MCP servers cannot be invoked through our proxy (by design).

## Future Considerations

If requirements change to support hosting/running stdio MCP servers (rather than just cataloging them), the `mcp-proxy` npm library could be reconsidered as a way to bridge stdio servers to HTTP endpoints.
