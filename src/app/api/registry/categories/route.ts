import { sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { requireBasicAuth } from "@/lib/auth/basic-auth";
import { db } from "@/lib/core/db";
import { tools } from "@/lib/core/db/schema";

export async function GET(request: NextRequest) {
  const authError = requireBasicAuth(request);
  if (authError) return authError;

  try {
    // Get all unique categories with counts, filtering out null categories
    const categoryResults = await db
      .select({
        name: tools.category,
        tool_count: sql<number>`count(*)::int`,
      })
      .from(tools)
      .where(sql`${tools.category} IS NOT NULL`)
      .groupBy(tools.category)
      .orderBy(sql`count(*) DESC`);

    return NextResponse.json({
      categories: categoryResults,
      total: categoryResults.length,
    });
  } catch (_error) {
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
