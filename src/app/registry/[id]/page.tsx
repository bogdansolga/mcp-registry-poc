import { ArrowLeft, Wrench } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ServerHeader } from "@/components/registry/server-header";
import { ToolsGrid } from "@/components/registry/tools-grid";
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
    <main className="min-h-screen bg-slate-50/50">
      <div className="container py-10">
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
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <Wrench className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Available Tools</CardTitle>
                  <CardDescription>{server.tools.length} tools provided by this server</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ToolsGrid tools={server.tools} serverId={server.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
