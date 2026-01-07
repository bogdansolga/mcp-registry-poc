"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToolInvocationDialog } from "./tool-invocation-dialog";

interface Tool {
  id: number;
  serverId: number;
  name: string;
  description: string | null;
  inputSchema: Record<string, unknown> | null;
  category: string | null;
}

interface ToolCardProps {
  tool: Tool;
  serverId: number;
}

export function ToolCard({ tool, serverId }: ToolCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Card className="border-muted">
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
          <div className="mt-4">
            <Button size="sm" variant="outline" onClick={() => setIsDialogOpen(true)}>
              Invoke Tool
            </Button>
          </div>
        </CardContent>
      </Card>

      <ToolInvocationDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        tool={tool}
        serverId={serverId}
      />
    </>
  );
}
