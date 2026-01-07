import { ArrowRight, Database, FolderOpen, Server, UserPlus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-background to-muted/30 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">MCP Registry</h1>
          <p className="mx-auto mt-4 max-w-2xl text-xl text-muted-foreground">
            Centralized catalog for Model Context Protocol servers
          </p>
          <p className="mx-auto mt-6 max-w-3xl text-muted-foreground">
            Discover, register, and manage MCP servers in one place. Browse available tools, monitor server health, and
            integrate powerful capabilities into your AI applications.
          </p>
          <div className="mt-8">
            <Button size="lg" asChild>
              <Link href="/registry">
                Browse Registry
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="text-center">
              <CardHeader className="pb-2">
                <CardTitle className="text-4xl font-bold text-primary">15+</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">Total Servers</CardDescription>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader className="pb-2">
                <CardTitle className="text-4xl font-bold text-green-600">12</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">Active Servers</CardDescription>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader className="pb-2">
                <CardTitle className="text-4xl font-bold text-blue-600">50+</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">Available Tools</CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Navigation Cards Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center text-2xl font-bold">Get Started</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/registry">
              <Card className="h-full transition-all hover:border-primary/50 hover:shadow-lg">
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Database className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Browse Registry</CardTitle>
                  <CardDescription>
                    Explore the complete catalog of registered MCP servers and their capabilities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-primary">
                    View servers
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/register">
              <Card className="h-full transition-all hover:border-primary/50 hover:shadow-lg">
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                    <UserPlus className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle>Register Server</CardTitle>
                  <CardDescription>
                    Add your MCP server to the registry and make it discoverable to others
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-green-600">
                    Register now
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/categories">
              <Card className="h-full transition-all hover:border-primary/50 hover:shadow-lg">
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                    <FolderOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle>Tool Categories</CardTitle>
                  <CardDescription>Browse tools organized by category to find exactly what you need</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-blue-600">
                    Browse categories
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center text-2xl font-bold">Why Use MCP Registry?</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <Server className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
              <h3 className="mb-2 font-semibold">Centralized Discovery</h3>
              <p className="text-sm text-muted-foreground">
                Find and connect to MCP servers from a single, unified catalog
              </p>
            </div>
            <div className="text-center">
              <Database className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
              <h3 className="mb-2 font-semibold">Rich Metadata</h3>
              <p className="text-sm text-muted-foreground">
                View detailed information about server capabilities, tools, and health status
              </p>
            </div>
            <div className="text-center">
              <FolderOpen className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
              <h3 className="mb-2 font-semibold">Organized Categories</h3>
              <p className="text-sm text-muted-foreground">
                Tools organized by category for easy browsing and discovery
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
