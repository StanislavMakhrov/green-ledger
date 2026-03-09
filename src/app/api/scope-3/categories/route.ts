import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.scope3Category.findMany({ orderBy: { code: "asc" } });
  return NextResponse.json(categories);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, material, materialityReason } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const updated = await prisma.scope3Category.update({ where: { id }, data: { material, materialityReason } });
  return NextResponse.json(updated);
}
