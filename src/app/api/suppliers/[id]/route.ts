import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import { createAuditEvent } from "@/lib/audit";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await prisma.supplier.findFirst({ where: { id, companyId: DEMO_COMPANY_ID } });
  if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(s);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const s = await prisma.supplier.findFirst({ where: { id, companyId: DEMO_COMPANY_ID } });
  if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updated = await prisma.supplier.update({ where: { id }, data: body });
  await createAuditEvent({ companyId: DEMO_COMPANY_ID, entityType: "supplier", entityId: id, action: "updated", actor: "user" });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await prisma.supplier.findFirst({ where: { id, companyId: DEMO_COMPANY_ID } });
  if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.supplier.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
