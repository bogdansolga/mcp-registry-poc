# PRD-2: Observability Dashboard
**Parent:** [MASTER-PRD.md](./MASTER-PRD.md)
**Priority:** 1
**Status:** Ready for Implementation
**Dependencies:** PRD-1 (Registry must be complete)

---

## Overview

Build a web-based observability dashboard that visualizes health metrics and usage analytics for all registered MCP servers. The dashboard uses ShadCN components and Tailwind CSS v4, matching the design system from finances-manager.

---

## Objectives

1. Create metrics aggregation APIs for health and usage data
2. Build responsive dashboard UI with recharts visualizations
3. Implement manual refresh functionality
4. Display real-time server status and performance metrics
5. Show top tools and usage trends

---

## Technical Requirements

### 1. Metrics API Endpoints

#### **GET /api/metrics/health**

**File:** `src/app/api/metrics/health/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/core/db';
import { mcpServers, serverHealthMetrics } from '@/lib/core/db/schema';
import { requireBasicAuth } from '@/lib/auth/basic-auth';

export async function GET(request: NextRequest) {
  const authError = requireBasicAuth(request);
  if (authError) return authError;

  try {
    // Server counts
    const serverCounts = await db
      .select({
        status: mcpServers.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(mcpServers)
      .groupBy(mcpServers.status);

    const total = serverCounts.reduce((sum, row) => sum + Number(row.count), 0);
    const active = serverCounts.find(row => row.status === 'active')?.count || 0;
    const inactive = serverCounts.find(row => row.status === 'inactive')?.count || 0;
    const error = serverCounts.find(row => row.status === 'error')?.count || 0;

    // Response time stats (last 24 hours)
    const [stats] = await db
      .select({
        avg: sql<number>`AVG(${serverHealthMetrics.responseTimeMs})::int`,
        p95: sql<number>`PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY ${serverHealthMetrics.responseTimeMs})::int`,
        p99: sql<number>`PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY ${serverHealthMetrics.responseTimeMs})::int`,
      })
      .from(serverHealthMetrics)
      .where(sql`${serverHealthMetrics.checkedAt} > NOW() - INTERVAL '24 hours'`);

    // Uptime calculation (successful checks / total checks)
    const [uptimeStats] = await db
      .select({
        successful: sql<number>`COUNT(*) FILTER (WHERE ${serverHealthMetrics.statusCode} BETWEEN 200 AND 299)`,
        total: sql<number>`COUNT(*)`,
      })
      .from(serverHealthMetrics)
      .where(sql`${serverHealthMetrics.checkedAt} > NOW() - INTERVAL '24 hours'`);

    const uptimePercent = uptimeStats.total > 0
      ? ((Number(uptimeStats.successful) / Number(uptimeStats.total)) * 100).toFixed(2)
      : '0.00';

    return NextResponse.json({
      total_servers: total,
      active_servers: Number(active),
      inactive_servers: Number(inactive),
      error_servers: Number(error),
      avg_response_time_ms: stats?.avg || 0,
      p95_response_time_ms: stats?.p95 || 0,
      p99_response_time_ms: stats?.p99 || 0,
      uptime_percent: parseFloat(uptimePercent),
      last_updated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Metrics error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
```

#### **GET /api/metrics/usage**

**File:** `src/app/api/metrics/usage/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { sql, desc } from 'drizzle-orm';
import { db } from '@/lib/core/db';
import { toolInvocations, tools, mcpServers } from '@/lib/core/db/schema';
import { requireBasicAuth } from '@/lib/auth/basic-auth';

export async function GET(request: NextRequest) {
  const authError = requireBasicAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '24h';

  // Map period to SQL interval
  const intervalMap: Record<string, string> = {
    '24h': '24 hours',
    '7d': '7 days',
    '30d': '30 days',
  };
  const interval = intervalMap[period] || '24 hours';

  try {
    // Total invocations and success rate
    const [totals] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        successful: sql<number>`COUNT(*) FILTER (WHERE ${toolInvocations.success} = true)`,
      })
      .from(toolInvocations)
      .where(sql`${toolInvocations.invokedAt} > NOW() - INTERVAL '${sql.raw(interval)}'`);

    const successRate = Number(totals.total) > 0
      ? ((Number(totals.successful) / Number(totals.total)) * 100).toFixed(2)
      : '0.00';

    // Top tools by invocation count
    const topTools = await db
      .select({
        tool_id: tools.id,
        tool_name: tools.name,
        server_name: mcpServers.name,
        invocation_count: sql<number>`COUNT(*)`,
        avg_duration_ms: sql<number>`AVG(${toolInvocations.durationMs})::int`,
      })
      .from(toolInvocations)
      .innerJoin(tools, sql`${toolInvocations.toolId} = ${tools.id}`)
      .innerJoin(mcpServers, sql`${tools.serverId} = ${mcpServers.id}`)
      .where(sql`${toolInvocations.invokedAt} > NOW() - INTERVAL '${sql.raw(interval)}'`)
      .groupBy(tools.id, tools.name, mcpServers.name)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(10);

    // Invocations over time (hourly buckets)
    const overTime = await db
      .select({
        timestamp: sql<string>`DATE_TRUNC('hour', ${toolInvocations.invokedAt})`,
        count: sql<number>`COUNT(*)`,
      })
      .from(toolInvocations)
      .where(sql`${toolInvocations.invokedAt} > NOW() - INTERVAL '${sql.raw(interval)}'`)
      .groupBy(sql`DATE_TRUNC('hour', ${toolInvocations.invokedAt})`)
      .orderBy(sql`DATE_TRUNC('hour', ${toolInvocations.invokedAt})`);

    return NextResponse.json({
      total_invocations: Number(totals.total),
      success_rate: parseFloat(successRate),
      top_tools: topTools,
      invocations_over_time: overTime,
    });

  } catch (error) {
    console.error('Usage metrics error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
```

#### **GET /api/metrics/servers/:id/stats**

**File:** `src/app/api/metrics/servers/[id]/stats/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { sql, eq, desc } from 'drizzle-orm';
import { db } from '@/lib/core/db';
import { serverHealthMetrics, toolInvocations } from '@/lib/core/db/schema';
import { requireBasicAuth } from '@/lib/auth/basic-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = requireBasicAuth(request);
  if (authError) return authError;

  const serverId = parseInt(params.id);
  if (isNaN(serverId)) {
    return NextResponse.json(
      { error: 'Invalid server ID', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '24h';

  const intervalMap: Record<string, string> = {
    '24h': '24 hours',
    '7d': '7 days',
    '30d': '30 days',
  };
  const interval = intervalMap[period] || '24 hours';

  try {
    // Uptime and avg response time
    const [stats] = await db
      .select({
        successful: sql<number>`COUNT(*) FILTER (WHERE ${serverHealthMetrics.statusCode} BETWEEN 200 AND 299)`,
        total: sql<number>`COUNT(*)`,
        avgResponseTime: sql<number>`AVG(${serverHealthMetrics.responseTimeMs})::int`,
        errorCount: sql<number>`COUNT(*) FILTER (WHERE ${serverHealthMetrics.errorMessage} IS NOT NULL)`,
      })
      .from(serverHealthMetrics)
      .where(sql`${serverHealthMetrics.serverId} = ${serverId} AND ${serverHealthMetrics.checkedAt} > NOW() - INTERVAL '${sql.raw(interval)}'`);

    const uptimePercent = Number(stats.total) > 0
      ? ((Number(stats.successful) / Number(stats.total)) * 100).toFixed(2)
      : '0.00';

    // Total invocations
    const [invocationStats] = await db
      .select({
        total: sql<number>`COUNT(*)`,
      })
      .from(toolInvocations)
      .where(sql`${toolInvocations.serverId} = ${serverId} AND ${toolInvocations.invokedAt} > NOW() - INTERVAL '${sql.raw(interval)}'`);

    // Response times over time
    const responseTimes = await db
      .select({
        timestamp: serverHealthMetrics.checkedAt,
        response_time_ms: serverHealthMetrics.responseTimeMs,
      })
      .from(serverHealthMetrics)
      .where(sql`${serverHealthMetrics.serverId} = ${serverId} AND ${serverHealthMetrics.checkedAt} > NOW() - INTERVAL '${sql.raw(interval)}'`)
      .orderBy(serverHealthMetrics.checkedAt)
      .limit(100);

    // Error log
    const errorLog = await db
      .select({
        timestamp: serverHealthMetrics.checkedAt,
        error_message: serverHealthMetrics.errorMessage,
        status_code: serverHealthMetrics.statusCode,
      })
      .from(serverHealthMetrics)
      .where(sql`${serverHealthMetrics.serverId} = ${serverId} AND ${serverHealthMetrics.errorMessage} IS NOT NULL`)
      .orderBy(desc(serverHealthMetrics.checkedAt))
      .limit(20);

    return NextResponse.json({
      server_id: serverId,
      uptime_percent: parseFloat(uptimePercent),
      avg_response_time_ms: stats.avgResponseTime || 0,
      error_count: Number(stats.errorCount),
      total_invocations: Number(invocationStats.total),
      response_times: responseTimes,
      error_log: errorLog,
    });

  } catch (error) {
    console.error('Server stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
```

### 2. Dashboard UI Components

#### **Dashboard Page**

**File:** `src/app/dashboard/page.tsx`

```typescript
import { Metadata } from 'next';
import { DashboardGrid } from '@/components/dashboard/dashboard-grid';
import { RefreshButton } from '@/components/dashboard/refresh-button';

export const metadata: Metadata = {
  title: 'Dashboard | MCP Registry',
  description: 'Observability metrics for MCP servers',
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Observability Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor health metrics and usage analytics across all MCP servers
          </p>
        </div>
        <RefreshButton />
      </div>

      <DashboardGrid />
    </div>
  );
}
```

#### **Dashboard Grid Component**

**File:** `src/components/dashboard/dashboard-grid.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { SystemHealthCard } from './system-health-card';
import { ResponseTimesCard } from './response-times-card';
import { RequestVolumeCard } from './request-volume-card';
import { TopToolsCard } from './top-tools-card';

export function DashboardGrid() {
  const [healthData, setHealthData] = useState(null);
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [healthRes, usageRes] = await Promise.all([
        fetch('/api/metrics/health'),
        fetch('/api/metrics/usage?period=24h'),
      ]);

      const health = await healthRes.json();
      const usage = await usageRes.json();

      setHealthData(health);
      setUsageData(usage);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen for refresh events
    const handleRefresh = () => fetchData();
    window.addEventListener('dashboard:refresh', handleRefresh);
    return () => window.removeEventListener('dashboard:refresh', handleRefresh);
  }, []);

  if (loading) {
    return <div className="text-center py-12">Loading dashboard...</div>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <SystemHealthCard data={healthData} />
      <ResponseTimesCard healthData={healthData} />
      <RequestVolumeCard data={usageData} />
      <TopToolsCard data={usageData} />
    </div>
  );
}
```

#### **System Health Card (Pie Chart)**

**File:** `src/components/dashboard/system-health-card.tsx`

```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = {
  active: '#22c55e',   // green-500
  inactive: '#94a3b8', // slate-400
  error: '#ef4444',    // red-500
};

export function SystemHealthCard({ data }: { data: any }) {
  if (!data) return null;

  const chartData = [
    { name: 'Active', value: data.active_servers, color: COLORS.active },
    { name: 'Inactive', value: data.inactive_servers, color: COLORS.inactive },
    { name: 'Error', value: data.error_servers, color: COLORS.error },
  ].filter(item => item.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Health</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{data.total_servers}</div>
            <div className="text-sm text-muted-foreground">Total Servers</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{data.uptime_percent}%</div>
            <div className="text-sm text-muted-foreground">Uptime (24h)</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{data.avg_response_time_ms}ms</div>
            <div className="text-sm text-muted-foreground">Avg Response</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### **Response Times Card (Bar Chart)**

**File:** `src/components/dashboard/response-times-card.tsx`

```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function ResponseTimesCard({ healthData }: { healthData: any }) {
  if (!healthData) return null;

  const data = [
    { metric: 'Average', value: healthData.avg_response_time_ms },
    { metric: 'P95', value: healthData.p95_response_time_ms },
    { metric: 'P99', value: healthData.p99_response_time_ms },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Response Times (24h)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="metric" />
              <YAxis label={{ value: 'milliseconds', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### **Request Volume Card (Line Chart)**

**File:** `src/components/dashboard/request-volume-card.tsx`

```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function RequestVolumeCard({ data }: { data: any }) {
  if (!data) return null;

  const chartData = data.invocations_over_time.map((item: any) => ({
    time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    count: Number(item.count),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Volume (24h)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-center">
          <div className="text-2xl font-bold">{data.total_invocations}</div>
          <div className="text-sm text-muted-foreground">Total Invocations</div>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### **Top Tools Card (Horizontal Bar Chart)**

**File:** `src/components/dashboard/top-tools-card.tsx`

```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function TopToolsCard({ data }: { data: any }) {
  if (!data) return null;

  const chartData = data.top_tools.map((tool: any) => ({
    name: `${tool.tool_name} (${tool.server_name})`,
    count: Number(tool.invocation_count),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Tools (24h)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={150} />
              <Tooltip />
              <Bar dataKey="count" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### **Refresh Button**

**File:** `src/components/dashboard/refresh-button.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export function RefreshButton() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);

    // Trigger refresh event
    window.dispatchEvent(new Event('dashboard:refresh'));

    // Reset spinner after 1 second
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <Button
      onClick={handleRefresh}
      variant="outline"
      size="sm"
      disabled={isRefreshing}
    >
      <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      Refresh
    </Button>
  );
}
```

---

## Implementation Checklist

- [ ] Create GET /api/metrics/health endpoint
- [ ] Create GET /api/metrics/usage endpoint
- [ ] Create GET /api/metrics/servers/:id/stats endpoint
- [ ] Install recharts package (`pnpm add recharts`)
- [ ] Create dashboard page at /dashboard
- [ ] Implement DashboardGrid component
- [ ] Create SystemHealthCard with pie chart
- [ ] Create ResponseTimesCard with bar chart
- [ ] Create RequestVolumeCard with line chart
- [ ] Create TopToolsCard with horizontal bar chart
- [ ] Implement RefreshButton with custom event
- [ ] Test all charts render correctly
- [ ] Verify manual refresh works

---

## Dependencies

- recharts (charts library)
- ShadCN Card component
- Lucide React (icons)
- PRD-1 (Registry) must be complete

---

## Success Criteria

✅ 3 metrics API endpoints functional
✅ Dashboard page renders without errors
✅ All 4 chart cards display data correctly
✅ Manual refresh button updates data
✅ Dashboard loads in < 2 seconds
✅ Charts are responsive on mobile

---

## Next Steps

After completing this deliverable:
1. Document dashboard usage in **PRD-3: Developer Documentation**
2. Add screenshots to recommendations report **PRD-4**
