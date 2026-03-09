import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as {
    material?: boolean;
    materialityReason?: string;
  };

  const updated = await prisma.scope3Category.update({
    where: { id },
    data: body,
  });
  return NextResponse.json(updated);
}
