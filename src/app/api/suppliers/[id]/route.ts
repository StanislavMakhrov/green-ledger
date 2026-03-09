import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supplier = await prisma.supplier.findFirst({
    where: { id, companyId: DEMO_COMPANY_ID },
  });
  if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(supplier);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as Partial<{
    name: string;
    country: string;
    sector: string;
    contactEmail: string;
    status: string;
  }>;

  const existing = await prisma.supplier.findFirst({
    where: { id, companyId: DEMO_COMPANY_ID },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.supplier.update({
    where: { id },
    data: body,
  });

  await prisma.auditTrailEvent.create({
    data: {
      companyId: DEMO_COMPANY_ID,
      entityType: "supplier",
      entityId: id,
      action: "updated",
      actor: "user",
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await prisma.supplier.findFirst({
    where: { id, companyId: DEMO_COMPANY_ID },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.supplier.update({
    where: { id },
    data: { status: "inactive" },
  });

  await prisma.auditTrailEvent.create({
    data: {
      companyId: DEMO_COMPANY_ID,
      entityType: "supplier",
      entityId: id,
      action: "updated",
      actor: "user",
      comment: "Soft-deleted (status set to inactive)",
    },
  });

  return NextResponse.json({ success: true });
}
