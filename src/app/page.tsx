import { ArrowRight, Database, FolderOpen, Server, UserPlus, Wrench } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface RegistryStats {
  totalServers: number;
  activeServers: number;
  totalTools: number;
  categories: number;
}

async function getRegistryStats(): Promise<RegistryStats> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  try {
    const [serversRes, categoriesRes] = await Promise.all([
      fetch(`${baseUrl}/api/registry/servers`, {
        headers: { Authorization: `Basic ${Buffer.from("admin:password").toString("base64")}` },
        cache: "no-store",
      }),
      fetch(`${baseUrl}/api/registry/categories`, {
        headers: { Authorization: `Basic ${Buffer.from("admin:password").toString("base64")}` },
        cache: "no-store",
      }),
    ]);

    const serversData = serversRes.ok ? await serversRes.json() : { servers: [], total: 0 };
    const categoriesData = categoriesRes.ok ? await categoriesRes.json() : { categories: [], total: 0 };

    const servers = serversData.servers || [];
    const activeServers = servers.filter((s: { status: string }) => s.status === "active").length;
    const totalTools = servers.reduce((sum: number, s: { tools_count: number }) => sum + (s.tools_count || 0), 0);

    return {
      totalServers: serversData.total || servers.length,
      activeServers,
      totalTools,
      categories: categoriesData.total || categoriesData.categories?.length || 0,
    };
  } catch {
    return { totalServers: 0, activeServers: 0, totalTools: 0, categories: 0 };
  }
}

export default async function Home() {
  const stats = await getRegistryStats();

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-slate-50 to-white py-16">
        <div className="container">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">MCP Registry</h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-600">
            Centralized catalog for Model Context Protocol servers. Discover, register, and manage MCP servers in one
            place.
          </p>
          <div className="mt-8">
            <Button size="lg" asChild className="gap-2">
              <Link href="/registry">
                Browse Registry
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b py-10">
        <div className="container">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Servers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalServers}</div>
                <p className="text-xs text-muted-foreground mt-1">Registered MCP servers</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Servers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{stats.activeServers}</div>
                <p className="text-xs text-muted-foreground mt-1">Currently responding</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Available Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{stats.totalTools}</div>
                <p className="text-xs text-muted-foreground mt-1">Across all servers</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{stats.categories}</div>
                <p className="text-xs text-muted-foreground mt-1">Tool categories</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Navigation Cards Section */}
      <section className="py-12">
        <div className="container">
          <h2 className="mb-8 text-2xl font-bold text-slate-900">Quick Actions</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/registry">
              <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md">
                <CardHeader>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Database className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Browse Registry</CardTitle>
                  <CardDescription>
                    Explore the complete catalog of registered MCP servers and their capabilities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-1 text-sm font-medium text-primary">
                    View servers
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/register">
              <Card className="h-full transition-all hover:border-green-500/50 hover:shadow-md">
                <CardHeader>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                    <UserPlus className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">Register Server</CardTitle>
                  <CardDescription>
                    Add your MCP server to the registry and make it discoverable to others
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                    Register now
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/categories">
              <Card className="h-full transition-all hover:border-blue-500/50 hover:shadow-md">
                <CardHeader>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                    <FolderOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">Tool Categories</CardTitle>
                  <CardDescription>Browse tools organized by category to find exactly what you need</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-1 text-sm font-medium text-blue-600">
                    Browse categories
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-slate-50/50 py-12">
        <div className="container">
          <h2 className="mb-8 text-2xl font-bold text-slate-900">Why Use the MCP Registry?</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                <Server className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Centralized Discovery</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Find and connect to MCP servers from a single, unified catalog
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                <Database className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Rich Metadata</h3>
                <p className="mt-1 text-sm text-slate-600">
                  View detailed information about server capabilities, tools, and health status
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                <Wrench className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Tool Invocation</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Test and invoke tools directly from the registry interface
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-4">
        <div className="container text-center text-sm text-slate-500">
          <p>N-iX MCP Registry PoC - Built for the Model Context Protocol ecosystem</p>
        </div>
      </footer>
    </main>
  );
}
