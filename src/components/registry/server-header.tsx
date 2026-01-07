import { BookOpen, ExternalLink, Github, Package, User, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ServerMetadata {
  serverId: number;
  author: string | null;
  repositoryUrl: string | null;
  documentationUrl: string | null;
  tags: string[] | null;
}

interface ServerHeaderProps {
  server: {
    id: number;
    name: string;
    displayName: string;
    description: string | null;
    serverType: "official" | "community" | "mock";
    status: "active" | "inactive" | "error";
    version: string | null;
  };
  metadata: ServerMetadata | null;
  toolsCount: number;
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "active":
      return "success";
    case "inactive":
      return "warning";
    case "error":
      return "error";
    default:
      return "secondary";
  }
}

function getTypeBadgeVariant(type: string) {
  switch (type) {
    case "official":
      return "default";
    case "community":
      return "secondary";
    case "mock":
      return "outline";
    default:
      return "secondary";
  }
}

export function ServerHeader({ server, metadata, toolsCount }: ServerHeaderProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl">{server.displayName}</CardTitle>
            <CardDescription className="text-sm">{server.name}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant={getStatusBadgeVariant(server.status)}>{server.status}</Badge>
            <Badge variant={getTypeBadgeVariant(server.serverType)}>{server.serverType}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {server.description && <p className="text-muted-foreground">{server.description}</p>}

        <div className="flex flex-wrap gap-6 text-sm">
          {server.version && (
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span>Version {server.version}</span>
            </div>
          )}
          {metadata?.author && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{metadata.author}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            <span>{toolsCount} tools</span>
          </div>
        </div>

        {(metadata?.repositoryUrl || metadata?.documentationUrl) && (
          <div className="flex gap-2">
            {metadata?.repositoryUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={metadata.repositoryUrl} target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4" />
                  Repository
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            )}
            {metadata?.documentationUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={metadata.documentationUrl} target="_blank" rel="noopener noreferrer">
                  <BookOpen className="h-4 w-4" />
                  Documentation
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            )}
          </div>
        )}

        {metadata?.tags && metadata.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {metadata.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
