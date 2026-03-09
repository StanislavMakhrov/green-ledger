import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/scope3/categories - list all scope 3 categories
export async function GET() {
  try {
    const categories = await prisma.scope3Category.findMany({
      orderBy: { code: "asc" },
    });

    return NextResponse.json({ data: categories });
  } catch {
    return NextResponse.json({ error: "Failed to fetch scope 3 categories" }, { status: 500 });
  }
}
