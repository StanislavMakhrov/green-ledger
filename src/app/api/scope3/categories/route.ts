import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const categories = await prisma.scope3Category.findMany({
    orderBy: { code: "asc" },
  });
  return NextResponse.json(categories);
}

export async function PATCH(request: NextRequest) {
  const body = (await request.json()) as {
    id: string;
    material?: boolean;
    materialityReason?: string;
  };

  const updated = await prisma.scope3Category.update({
    where: { id: body.id },
    data: {
      ...(body.material !== undefined ? { material: body.material } : {}),
      ...(body.materialityReason !== undefined
        ? { materialityReason: body.materialityReason }
        : {}),
    },
  });

  return NextResponse.json(updated);
}
