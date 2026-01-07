import { ArrowLeft } from "lucide-react";
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
            <ToolsGrid tools={server.tools} serverId={server.id} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
