import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// PUT /api/scope3/categories/[id] - update category materiality
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json() as {
      material?: boolean;
      materialityReason?: string;
    };
    const { material, materialityReason } = body;

    if (material === undefined) {
      return NextResponse.json(
        { error: "Missing required field: material" },
        { status: 400 }
      );
    }

    const existing = await prisma.scope3Category.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const category = await prisma.scope3Category.update({
      where: { id },
      data: {
        material,
        materialityReason: materialityReason ?? null,
      },
    });

    return NextResponse.json({ data: category });
  } catch {
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}
