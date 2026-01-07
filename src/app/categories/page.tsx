import { FolderOpen } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Category {
  name: string;
  tool_count: number;
}

interface CategoriesResponse {
  categories: Category[];
  total: number;
}

async function getCategories(): Promise<CategoriesResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  try {
    const response = await fetch(`${baseUrl}/api/registry/categories`, {
      headers: {
        Authorization: `Basic ${Buffer.from("admin:password").toString("base64")}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch categories");
    }

    return response.json();
  } catch (_error) {
    return { categories: [], total: 0 };
  }
}

export default async function CategoriesPage() {
  const data = await getCategories();

  return (
    <main className="min-h-screen bg-slate-50/50">
      <div className="container py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Tool Categories</h1>
          <p className="mt-2 text-slate-600">Browse MCP tools organized by category</p>
        </div>

        {/* Stats Card */}
        <div className="mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{data.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {data.categories.reduce((sum, c) => sum + c.tool_count, 0)} tools across all categories
              </p>
            </CardContent>
          </Card>
        </div>

        {data.categories.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">No categories available</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.categories.map((category) => (
              <Link key={category.name} href={`/categories/${encodeURIComponent(category.name)}`}>
                <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                        <FolderOpen className="h-5 w-5 text-blue-600" />
                      </div>
                      <Badge variant="secondary">{category.tool_count}</Badge>
                    </div>
                    <CardTitle className="mt-3 text-lg capitalize">{category.name}</CardTitle>
                    <CardDescription>
                      {category.tool_count} tool{category.tool_count !== 1 ? "s" : ""} available
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
