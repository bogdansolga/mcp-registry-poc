# PRD-5: Discovery API/Portal
**Parent:** [MASTER-PRD.md](./MASTER-PRD.md)
**Priority:** 2
**Status:** Ready for Implementation
**Dependencies:** PRD-1 (Registry must be complete)

---

## Overview

Build a search and discovery system that enables developers to find MCP servers and tools based on keywords, categories, and capabilities. Includes both REST API endpoints and a web-based registry browser UI.

---

## Objectives

1. Implement full-text search across servers and tools
2. Create category-based filtering and browsing
3. Build registry browser web UI with data tables
4. Enable server detail pages with tool exploration
5. Add tag-based discovery

---

## Technical Requirements

### 1. Search API Endpoint

#### **GET /api/registry/search**

**File:** `src/app/api/registry/search/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { sql, like, or, ilike } from 'drizzle-orm';
import { db } from '@/lib/core/db';
import { mcpServers, tools, serverMetadata } from '@/lib/core/db/schema';
import { requireBasicAuth } from '@/lib/auth/basic-auth';

export async function GET(request: NextRequest) {
  const authError = requireBasicAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.trim().length < 2) {
    return NextResponse.json(
      { error: 'Query must be at least 2 characters', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  const searchTerm = `%${query}%`;

  try {
    // Search servers
    const servers = await db
      .select({
        id: mcpServers.id,
        name: mcpServers.name,
        display_name: mcpServers.displayName,
        description: mcpServers.description,
        server_type: mcpServers.serverType,
        status: mcpServers.status,
      })
      .from(mcpServers)
      .where(
        or(
          ilike(mcpServers.name, searchTerm),
          ilike(mcpServers.displayName, searchTerm),
          ilike(mcpServers.description, searchTerm)
        )
      )
      .limit(20);

    // Search tools
    const toolResults = await db
      .select({
        tool_id: tools.id,
        tool_name: tools.name,
        tool_description: tools.description,
        tool_category: tools.category,
        server_id: mcpServers.id,
        server_name: mcpServers.displayName,
      })
      .from(tools)
      .innerJoin(mcpServers, sql`${tools.serverId} = ${mcpServers.id}`)
      .where(
        or(
          ilike(tools.name, searchTerm),
          ilike(tools.description, searchTerm),
          ilike(tools.category, searchTerm)
        )
      )
      .limit(20);

    return NextResponse.json({
      query: query,
      servers: servers,
      tools: toolResults,
      total_results: servers.length + toolResults.length,
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
```

### 2. Category Browsing API

#### **GET /api/registry/categories**

**File:** `src/app/api/registry/categories/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/core/db';
import { tools } from '@/lib/core/db/schema';
import { requireBasicAuth } from '@/lib/auth/basic-auth';

export async function GET(request: NextRequest) {
  const authError = requireBasicAuth(request);
  if (authError) return authError;

  try {
    // Get all unique categories with tool counts
    const categories = await db
      .select({
        category: tools.category,
        tool_count: sql<number>`COUNT(*)`,
      })
      .from(tools)
      .where(sql`${tools.category} IS NOT NULL`)
      .groupBy(tools.category)
      .orderBy(sql`COUNT(*) DESC`);

    return NextResponse.json({
      categories: categories.map(cat => ({
        name: cat.category,
        tool_count: Number(cat.tool_count),
      })),
      total: categories.length,
    });

  } catch (error) {
    console.error('Categories error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
```

#### **GET /api/registry/categories/:category/tools**

**File:** `src/app/api/registry/categories/[category]/tools/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/core/db';
import { tools, mcpServers } from '@/lib/core/db/schema';
import { requireBasicAuth } from '@/lib/auth/basic-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { category: string } }
) {
  const authError = requireBasicAuth(request);
  if (authError) return authError;

  const category = decodeURIComponent(params.category);

  try {
    const toolResults = await db
      .select({
        id: tools.id,
        name: tools.name,
        description: tools.description,
        category: tools.category,
        server_id: mcpServers.id,
        server_name: mcpServers.displayName,
        server_status: mcpServers.status,
      })
      .from(tools)
      .innerJoin(mcpServers, sql`${tools.serverId} = ${mcpServers.id}`)
      .where(eq(tools.category, category));

    return NextResponse.json({
      category: category,
      tools: toolResults,
      total: toolResults.length,
    });

  } catch (error) {
    console.error('Category tools error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
```

### 3. Registry Browser UI

#### **Registry Page**

**File:** `src/app/registry/page.tsx`

```typescript
import { Metadata } from 'next';
import { RegistryBrowser } from '@/components/registry/registry-browser';

export const metadata: Metadata = {
  title: 'MCP Registry | Browse Servers',
  description: 'Browse and search available MCP servers',
};

export default function RegistryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">MCP Server Registry</h1>
        <p className="text-muted-foreground">
          Browse and search available Model Context Protocol servers and tools
        </p>
      </div>

      <RegistryBrowser />
    </div>
  );
}
```

#### **Registry Browser Component**

**File:** `src/components/registry/registry-browser.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { ServerTable } from './server-table';
import { SearchBar } from './search-bar';
import { FilterPanel } from './filter-panel';

export function RegistryBrowser() {
  const [servers, setServers] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: '',
  });
  const [loading, setLoading] = useState(true);

  const fetchServers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/registry/servers?${params.toString()}`);
      const data = await response.json();
      setServers(data.servers || []);
    } catch (error) {
      console.error('Failed to fetch servers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, [filters]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <SearchBar
          value={filters.search}
          onChange={(value) => setFilters({ ...filters, search: value })}
          onSearch={fetchServers}
        />
      </div>

      <div className="flex gap-6">
        <aside className="w-64 flex-shrink-0">
          <FilterPanel
            filters={filters}
            onChange={setFilters}
          />
        </aside>

        <main className="flex-1">
          {loading ? (
            <div className="text-center py-12">Loading servers...</div>
          ) : (
            <ServerTable servers={servers} />
          )}
        </main>
      </div>
    </div>
  );
}
```

#### **Search Bar Component**

**File:** `src/components/registry/search-bar.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
}

export function SearchBar({ value, onChange, onSearch }: SearchBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="flex gap-2 flex-1">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search servers and tools..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-10"
        />
      </div>
      <Button onClick={onSearch} variant="default">
        Search
      </Button>
    </div>
  );
}
```

#### **Filter Panel Component**

**File:** `src/components/registry/filter-panel.tsx`

```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface FilterPanelProps {
  filters: {
    status: string;
    type: string;
  };
  onChange: (filters: any) => void;
}

export function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const statuses = ['all', 'active', 'inactive', 'error'];
  const types = ['all', 'official', 'community', 'mock'];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Status</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={filters.status || 'all'}
            onValueChange={(value) =>
              onChange({ ...filters, status: value === 'all' ? '' : value })
            }
          >
            {statuses.map((status) => (
              <div key={status} className="flex items-center space-x-2">
                <RadioGroupItem value={status} id={`status-${status}`} />
                <Label htmlFor={`status-${status}`} className="capitalize cursor-pointer">
                  {status}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Type</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={filters.type || 'all'}
            onValueChange={(value) =>
              onChange({ ...filters, type: value === 'all' ? '' : value })
            }
          >
            {types.map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <RadioGroupItem value={type} id={`type-${type}`} />
                <Label htmlFor={`type-${type}`} className="capitalize cursor-pointer">
                  {type}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### **Server Table Component**

**File:** `src/components/registry/server-table.tsx`

```typescript
'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';

interface Server {
  id: number;
  name: string;
  display_name: string;
  server_type: string;
  status: string;
  tools_count: number;
  last_health_check: string | null;
  version: string | null;
}

interface ServerTableProps {
  servers: Server[];
}

const statusVariants: Record<string, 'default' | 'destructive' | 'secondary'> = {
  active: 'default',
  error: 'destructive',
  inactive: 'secondary',
};

export function ServerTable({ servers }: ServerTableProps) {
  if (servers.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No servers found. Try adjusting your search or filters.
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Server Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Tools</TableHead>
            <TableHead>Last Health Check</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {servers.map((server) => (
            <TableRow key={server.id} className="cursor-pointer hover:bg-muted/50">
              <TableCell>
                <Badge variant={statusVariants[server.status]}>
                  {server.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{server.display_name}</div>
                  <div className="text-sm text-muted-foreground">{server.name}</div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {server.server_type}
                </Badge>
              </TableCell>
              <TableCell>{server.tools_count} tools</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {server.last_health_check
                  ? formatDistanceToNow(new Date(server.last_health_check), { addSuffix: true })
                  : 'Never'}
              </TableCell>
              <TableCell className="text-right">
                <Link href={`/registry/${server.id}`}>
                  <Button variant="ghost" size="sm">
                    View Details
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

### 4. Server Detail Page

**File:** `src/app/registry/[id]/page.tsx`

```typescript
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { ServerHeader } from '@/components/registry/server-header';
import { ServerTabs } from '@/components/registry/server-tabs';

async function getServer(id: string) {
  // In real implementation, fetch from API with server-side auth
  const response = await fetch(`http://localhost:3000/api/registry/servers/${id}`, {
    headers: {
      Authorization: 'Basic ' + Buffer.from('admin:password').toString('base64'),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const server = await getServer(params.id);

  if (!server) {
    return {
      title: 'Server Not Found',
    };
  }

  return {
    title: `${server.display_name} | MCP Registry`,
    description: server.description,
  };
}

export default async function ServerDetailPage({ params }: { params: { id: string } }) {
  const server = await getServer(params.id);

  if (!server) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <ServerHeader server={server} />
      <ServerTabs server={server} />
    </div>
  );
}
```

#### **Server Header Component**

**File:** `src/components/registry/server-header.tsx`

```typescript
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, Github, BookOpen } from 'lucide-react';
import Link from 'next/link';

export function ServerHeader({ server }: { server: any }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{server.display_name}</h1>
              <Badge variant={server.status === 'active' ? 'default' : 'destructive'}>
                {server.status}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {server.server_type}
              </Badge>
            </div>
            <p className="text-muted-foreground">{server.description}</p>
          </div>

          {server.metadata && (
            <div className="flex gap-2">
              {server.metadata.repository_url && (
                <Link href={server.metadata.repository_url} target="_blank">
                  <Badge variant="outline" className="gap-1 cursor-pointer hover:bg-accent">
                    <Github className="h-3 w-3" />
                    Repository
                  </Badge>
                </Link>
              )}
              {server.metadata.documentation_url && (
                <Link href={server.metadata.documentation_url} target="_blank">
                  <Badge variant="outline" className="gap-1 cursor-pointer hover:bg-accent">
                    <BookOpen className="h-3 w-3" />
                    Docs
                  </Badge>
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
          <div>
            <span className="font-medium">Version:</span> {server.version || 'N/A'}
          </div>
          {server.metadata?.author && (
            <div>
              <span className="font-medium">Author:</span> {server.metadata.author}
            </div>
          )}
          <div>
            <span className="font-medium">Tools:</span> {server.tools.length}
          </div>
        </div>

        {server.metadata?.tags && server.metadata.tags.length > 0 && (
          <div className="mt-3 flex gap-2">
            {server.metadata.tags.map((tag: string) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Implementation Checklist

- [ ] Create GET /api/registry/search endpoint
- [ ] Create GET /api/registry/categories endpoint
- [ ] Create GET /api/registry/categories/:category/tools endpoint
- [ ] Install date-fns package (`pnpm add date-fns`)
- [ ] Create /registry page with RegistryBrowser component
- [ ] Implement SearchBar component
- [ ] Implement FilterPanel component with status/type filters
- [ ] Implement ServerTable component with ShadCN Table
- [ ] Create /registry/:id server detail page
- [ ] Implement ServerHeader component
- [ ] Implement ServerTabs component (tools, metrics, health log)
- [ ] Add ShadCN RadioGroup and Checkbox components
- [ ] Test search functionality
- [ ] Test filters and category browsing
- [ ] Verify server detail page navigation

---

## Dependencies

- ShadCN Table, Badge, RadioGroup, Checkbox components
- date-fns (date formatting)
- PRD-1 (Registry) must be complete
- Lucide React (icons)

---

## Success Criteria

✅ Search API returns results in < 500ms
✅ Registry browser displays all servers in table format
✅ Filters work correctly (status, type)
✅ Search updates results without page reload
✅ Server detail page shows all tools and metadata
✅ UI is responsive on mobile and desktop
✅ Navigation between registry and detail pages works

---

## Next Steps

After completing this deliverable:
1. Add pagination to server table (if > 50 servers)
2. Implement advanced search (by tag, author, category)
3. Add "Recently Added" and "Most Popular" sections to landing page
4. Document search API in **PRD-3: Developer Documentation**
