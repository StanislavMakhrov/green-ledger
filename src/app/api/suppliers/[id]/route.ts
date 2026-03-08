import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import { createAuditEvent } from "@/lib/audit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const supplier = await prisma.supplier.findFirst({
    where: { id, companyId: DEMO_COMPANY_ID },
  });
  if (!supplier) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(supplier);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = (await request.json()) as Partial<{
    name: string;
    country: string;
    sector: string;
    contactEmail: string;
    status: string;
  }>;

  const supplier = await prisma.supplier.updateMany({
    where: { id, companyId: DEMO_COMPANY_ID },
    data: body,
  });

  if (supplier.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await createAuditEvent({
    companyId: DEMO_COMPANY_ID,
    entityType: "supplier",
    entityId: id,
    action: "updated",
    actor: "user",
  });

  const updated = await prisma.supplier.findUnique({ where: { id } });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  const result = await prisma.supplier.deleteMany({
    where: { id, companyId: DEMO_COMPANY_ID },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
