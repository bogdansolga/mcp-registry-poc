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
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Tool Categories</h1>
        <p className="mt-2 text-muted-foreground">Browse MCP tools by category</p>
      </div>

      {data.categories.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">No categories available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.categories.map((category) => (
            <Link key={category.name} href={`/categories/${encodeURIComponent(category.name)}`}>
              <Card className="h-full transition-colors hover:border-primary/50 hover:bg-accent/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg capitalize">{category.name}</CardTitle>
                    <Badge variant="secondary">{category.tool_count} tools</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Browse {category.tool_count} tool{category.tool_count !== 1 ? "s" : ""} in the {category.name}{" "}
                    category
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
