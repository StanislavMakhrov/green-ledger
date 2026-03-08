import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEMO_COMPANY_ID } from "@/lib/constants";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as {
    name?: string;
    country?: string;
    sector?: string;
    contactEmail?: string;
    status?: string;
  };

  // Verify ownership: supplier must belong to the demo company
  const existing = await prisma.supplier.findFirst({
    where: { id, companyId: DEMO_COMPANY_ID },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.supplier.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Verify ownership before deletion
  const existing = await prisma.supplier.findFirst({
    where: { id, companyId: DEMO_COMPANY_ID },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.supplier.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
