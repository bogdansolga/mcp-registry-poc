import { RegistryBrowser } from "@/components/registry/registry-browser";

export default function RegistryPage() {
  return (
    <main className="min-h-screen bg-slate-50/50">
      <div className="container py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900">MCP Server Registry</h1>
          <p className="mt-2 text-slate-600">
            Browse and search available Model Context Protocol servers and tools
          </p>
        </div>

        <RegistryBrowser />
      </div>
    </main>
  );
}
