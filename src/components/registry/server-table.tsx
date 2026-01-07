"use client";

import { formatDistanceToNow } from "date-fns";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Server {
  id: number;
  name: string;
  display_name: string;
  server_type: "official" | "community" | "mock";
  status: "active" | "inactive" | "error";
  version: string | null;
  last_health_check: string | null;
  tools_count: number;
}

interface ServerTableProps {
  servers: Server[];
  isLoading?: boolean;
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

export function ServerTable({ servers, isLoading }: ServerTableProps) {
  if (isLoading) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">Loading servers...</div>;
  }

  if (servers.length === 0) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">No servers found</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-24">Status</TableHead>
          <TableHead>Server Name</TableHead>
          <TableHead className="w-28">Type</TableHead>
          <TableHead className="w-20 text-center">Tools</TableHead>
          <TableHead className="w-40">Last Health Check</TableHead>
          <TableHead className="w-24">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {servers.map((server) => (
          <TableRow key={server.id}>
            <TableCell>
              <Badge variant={getStatusBadgeVariant(server.status)}>{server.status}</Badge>
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium">{server.display_name}</span>
                <span className="text-sm text-muted-foreground">{server.name}</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={getTypeBadgeVariant(server.server_type)}>{server.server_type}</Badge>
            </TableCell>
            <TableCell className="text-center">{server.tools_count}</TableCell>
            <TableCell>
              {server.last_health_check
                ? formatDistanceToNow(new Date(server.last_health_check), {
                    addSuffix: true,
                  })
                : "Never"}
            </TableCell>
            <TableCell>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/registry/${server.id}`}>
                  <ExternalLink className="h-4 w-4" />
                  View
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
