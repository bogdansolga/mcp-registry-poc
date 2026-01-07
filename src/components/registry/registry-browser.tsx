"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { FilterPanel, type FilterState } from "./filter-panel";
import { SearchBar } from "./search-bar";
import { ServerTable } from "./server-table";

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

interface ServersResponse {
  servers: Server[];
  total: number;
}

export function RegistryBrowser() {
  const [servers, setServers] = useState<Server[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    status: "all",
    type: "all",
  });

  const fetchServers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (filters.status !== "all") {
        params.set("status", filters.status);
      }
      if (filters.type !== "all") {
        params.set("type", filters.type);
      }
      if (searchValue) {
        params.set("search", searchValue);
      }

      const url = `/api/registry/servers${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url, {
        credentials: "include",
        headers: {
          Authorization: `Basic ${btoa("admin:password")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch servers");
      }

      const data: ServersResponse = await response.json();
      setServers(data.servers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [filters, searchValue]);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  const handleSearch = () => {
    fetchServers();
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  return (
    <div className="flex gap-6">
      {/* Sidebar Filters */}
      <aside className="w-64 shrink-0">
        <FilterPanel filters={filters} onChange={handleFilterChange} />
      </aside>

      {/* Main Content */}
      <div className="flex-1 space-y-4">
        <SearchBar value={searchValue} onChange={setSearchValue} onSearch={handleSearch} />

        <Card className="p-0">
          {error ? (
            <div className="flex items-center justify-center py-12 text-destructive">{error}</div>
          ) : (
            <ServerTable servers={servers} isLoading={isLoading} />
          )}
        </Card>
      </div>
    </div>
  );
}
