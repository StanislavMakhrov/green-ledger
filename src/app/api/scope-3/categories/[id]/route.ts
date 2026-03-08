import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
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
