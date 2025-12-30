import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireBasicAuth } from "@/lib/auth/basic-auth";
import { db } from "@/lib/core/db";
import { mcpServers, serverMetadata, tools } from "@/lib/core/db/schema";

const RegisterSchema = z.object({
  name: z.string().min(1).max(100),
  display_name: z.string().min(1).max(200),
  description: z.string().optional(),
  server_type: z.enum(["official", "community", "mock"]),
  endpoint_url: z.string().url(),
  version: z.string().optional(),
  metadata: z
    .object({
      author: z.string().optional(),
      repository_url: z.string().url().optional(),
      documentation_url: z.string().url().optional(),
      tags: z.array(z.string()).optional(),
    })
    .optional(),
  tools: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      input_schema: z.record(z.string(), z.any()),
      category: z.string().optional(),
    }),
  ),
});

export async function POST(request: NextRequest) {
  // Authenticate
  const authError = requireBasicAuth(request);
  if (authError) return authError;

  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  // Validate
  const result = RegisterSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", code: "VALIDATION_ERROR", details: result.error.issues },
      { status: 400 },
    );
  }

  const data = result.data;

  try {
    // Insert server
    const [server] = await db
      .insert(mcpServers)
      .values({
        name: data.name,
        displayName: data.display_name,
        description: data.description,
        serverType: data.server_type,
        endpointUrl: data.endpoint_url,
        version: data.version,
        status: "active",
      })
      .returning();

    // Insert metadata if provided
    if (data.metadata) {
      await db.insert(serverMetadata).values({
        serverId: server.id,
        author: data.metadata.author,
        repositoryUrl: data.metadata.repository_url,
        documentationUrl: data.metadata.documentation_url,
        tags: data.metadata.tags,
      });
    }

    // Insert tools
    if (data.tools.length > 0) {
      await db.insert(tools).values(
        data.tools.map((tool) => ({
          serverId: server.id,
          name: tool.name,
          description: tool.description,
          inputSchema: tool.input_schema,
          category: tool.category,
        })),
      );
    }

    // Schedule immediate health check
    // (Will be handled by background job)

    return NextResponse.json(
      {
        id: server.id,
        name: server.name,
        status: server.status,
        created_at: server.createdAt,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      // Unique constraint violation
      return NextResponse.json(
        { error: "Server with this name already exists", code: "DUPLICATE_SERVER" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
