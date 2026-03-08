import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/scope3/categories — list all 15 ESRS E1 Scope 3 categories. */
export async function GET() {
  const categories = await prisma.scope3Category.findMany({
    orderBy: { code: "asc" },
  });
  return NextResponse.json(categories);
}
