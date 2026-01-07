import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ServerHeader } from "@/components/registry/server-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Tool {
  id: number;
  serverId: number;
  name: string;
  description: string | null;
  inputSchema: Record<string, unknown> | null;
  category: string | null;
  createdAt: string;
}

interface ServerMetadata {
  serverId: number;
  author: string | null;
  repositoryUrl: string | null;
  documentationUrl: string | null;
  tags: string[] | null;
}

interface ServerDetail {
  id: number;
  name: string;
  displayName: string;
  description: string | null;
  serverType: "official" | "community" | "mock";
  endpointUrl: string;
  status: "active" | "inactive" | "error";
  version: string | null;
  lastHealthCheck: string | null;
  createdAt: string;
  updatedAt: string;
  metadata: ServerMetadata | null;
  tools: Tool[];
}

async function getServerDetails(id: string): Promise<ServerDetail | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  try {
    const response = await fetch(`${baseUrl}/api/registry/servers/${id}`, {
      headers: {
        Authorization: `Basic ${Buffer.from("admin:password").toString("base64")}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error("Failed to fetch server details");
    }

    return response.json();
  } catch (_error) {
    return null;
  }
}

export default async function ServerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const server = await getServerDetails(id);

  if (!server) {
    notFound();
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/registry">
            <ArrowLeft className="h-4 w-4" />
            Back to Registry
          </Link>
        </Button>
      </div>

      <div className="space-y-6">
        <ServerHeader server={server} metadata={server.metadata} toolsCount={server.tools.length} />

        <Card>
          <CardHeader>
            <CardTitle>Available Tools</CardTitle>
            <CardDescription>{server.tools.length} tools provided by this server</CardDescription>
          </CardHeader>
          <CardContent>
            {server.tools.length === 0 ? (
              <p className="text-muted-foreground">No tools available</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {server.tools.map((tool) => (
                  <Card key={tool.id} className="border-muted">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{tool.name}</CardTitle>
                        {tool.category && (
                          <Badge variant="outline" className="text-xs">
                            {tool.category}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{tool.description || "No description available"}</p>
                      {tool.inputSchema && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                            View input schema
                          </summary>
                          <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs">
                            {JSON.stringify(tool.inputSchema, null, 2)}
                          </pre>
                        </details>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
