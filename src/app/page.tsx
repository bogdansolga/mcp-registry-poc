import { ArrowRight, Database, FolderOpen, Server, UserPlus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-slate-50 to-white py-24">
        <div className="container text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">MCP Registry</h1>
          <p className="mx-auto mt-6 max-w-2xl text-xl text-slate-600">
            Centralized catalog for Model Context Protocol servers
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-slate-500">
            Discover, register, and manage MCP servers in one place. Browse available tools, monitor server health, and
            integrate powerful capabilities into your AI applications.
          </p>
          <div className="mt-10">
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
      <section className="border-b py-16">
        <div className="container">
          <div className="grid gap-6 sm:grid-cols-3">
            <Card className="text-center shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-4xl font-bold text-primary">15+</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">Total Servers</CardDescription>
              </CardContent>
            </Card>
            <Card className="text-center shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-4xl font-bold text-green-600">12</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">Active Servers</CardDescription>
              </CardContent>
            </Card>
            <Card className="text-center shadow-sm">
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
      <section className="py-20">
        <div className="container">
          <h2 className="mb-12 text-center text-3xl font-bold text-slate-900">Get Started</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/registry">
              <Card className="h-full shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
                <CardHeader className="pb-4">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                    <Database className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Browse Registry</CardTitle>
                  <CardDescription className="text-base">
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
              <Card className="h-full shadow-sm transition-all hover:border-green-500/50 hover:shadow-md">
                <CardHeader className="pb-4">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-green-500/10">
                    <UserPlus className="h-7 w-7 text-green-600" />
                  </div>
                  <CardTitle className="text-xl">Register Server</CardTitle>
                  <CardDescription className="text-base">
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
              <Card className="h-full shadow-sm transition-all hover:border-blue-500/50 hover:shadow-md">
                <CardHeader className="pb-4">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10">
                    <FolderOpen className="h-7 w-7 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">Tool Categories</CardTitle>
                  <CardDescription className="text-base">
                    Browse tools organized by category to find exactly what you need
                  </CardDescription>
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
      <section className="border-t bg-slate-50 py-20">
        <div className="container">
          <h2 className="mb-12 text-center text-3xl font-bold text-slate-900">Why Use MCP Registry?</h2>
          <div className="grid gap-12 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
                <Server className="h-8 w-8 text-slate-600" />
              </div>
              <h3 className="mb-3 text-lg font-semibold text-slate-900">Centralized Discovery</h3>
              <p className="text-slate-600">Find and connect to MCP servers from a single, unified catalog</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
                <Database className="h-8 w-8 text-slate-600" />
              </div>
              <h3 className="mb-3 text-lg font-semibold text-slate-900">Rich Metadata</h3>
              <p className="text-slate-600">
                View detailed information about server capabilities, tools, and health status
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
                <FolderOpen className="h-8 w-8 text-slate-600" />
              </div>
              <h3 className="mb-3 text-lg font-semibold text-slate-900">Organized Categories</h3>
              <p className="text-slate-600">Tools organized by category for easy browsing and discovery</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container text-center text-sm text-slate-500">
          <p>MCP Registry &copy; {new Date().getFullYear()}. Built for the Model Context Protocol ecosystem.</p>
        </div>
      </footer>
    </main>
  );
}
