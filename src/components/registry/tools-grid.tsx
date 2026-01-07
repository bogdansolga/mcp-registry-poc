"use client";

import { ToolCard } from "./tool-card";

interface Tool {
  id: number;
  serverId: number;
  name: string;
  description: string | null;
  inputSchema: Record<string, unknown> | null;
  category: string | null;
}

interface ToolsGridProps {
  tools: Tool[];
  serverId: number;
}

export function ToolsGrid({ tools, serverId }: ToolsGridProps) {
  if (tools.length === 0) {
    return <p className="text-muted-foreground">No tools available</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {tools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} serverId={serverId} />
      ))}
    </div>
  );
}
