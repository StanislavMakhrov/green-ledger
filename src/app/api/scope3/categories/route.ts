import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await prisma.scope3Category.findMany({
      orderBy: { code: "asc" },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Scope3 categories GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
