import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Tool {
  id: number;
  name: string;
  description: string | null;
  server_name: string;
  server_id: number;
}

interface CategoryToolsResponse {
  category: string;
  tools: Tool[];
  total: number;
}

async function getCategoryTools(category: string): Promise<CategoryToolsResponse | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  try {
    const response = await fetch(`${baseUrl}/api/registry/categories/${encodeURIComponent(category)}/tools`, {
      headers: {
        Authorization: `Basic ${Buffer.from("admin:password").toString("base64")}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error("Failed to fetch category tools");
    }

    return response.json();
  } catch (_error) {
    return null;
  }
}

export default async function CategoryDetailPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const decodedCategory = decodeURIComponent(category);
  const data = await getCategoryTools(decodedCategory);

  if (!data) {
    notFound();
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/categories">
            <ArrowLeft className="h-4 w-4" />
            Back to Categories
          </Link>
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold capitalize">{data.category}</h1>
        <p className="mt-2 text-muted-foreground">
          {data.total} tool{data.total !== 1 ? "s" : ""} in this category
        </p>
      </div>

      {data.tools.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">No tools found in this category</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.tools.map((tool) => (
            <Card key={tool.id} className="h-full">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{tool.name}</CardTitle>
                </div>
                <CardDescription>{tool.description || "No description available"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Server:</span>
                  <Link href={`/registry/${tool.server_id}`}>
                    <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                      {tool.server_name}
                    </Badge>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
