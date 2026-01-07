import { RegistryBrowser } from "@/components/registry/registry-browser";

export default function RegistryPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">MCP Server Registry</h1>
        <p className="mt-2 text-muted-foreground">
          Browse and search available Model Context Protocol servers and tools
        </p>
      </div>

      <RegistryBrowser />
    </main>
  );
}
