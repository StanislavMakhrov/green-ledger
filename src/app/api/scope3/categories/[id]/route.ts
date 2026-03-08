import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** PATCH /api/scope3/categories/[id] — update materiality for a category. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const updated = await prisma.scope3Category.update({
    where: { id },
    data: {
      material: body.material,
      materialityReason: body.materialityReason ?? null,
    },
  });
  return NextResponse.json(updated);
}
