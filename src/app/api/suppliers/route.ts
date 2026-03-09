import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import { createAuditEvent } from "@/lib/audit";
import { randomUUID } from "crypto";

export async function GET() {
  const suppliers = await prisma.supplier.findMany({ where: { companyId: DEMO_COMPANY_ID }, orderBy: { name: "asc" } });
  return NextResponse.json(suppliers);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, country, sector, contactEmail } = body;
  if (!name || !country || !sector || !contactEmail)
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  const supplier = await prisma.supplier.create({
    data: { companyId: DEMO_COMPANY_ID, name, country, sector, contactEmail, publicFormToken: randomUUID(), status: "active" },
  });
  await createAuditEvent({ companyId: DEMO_COMPANY_ID, entityType: "supplier", entityId: supplier.id, action: "created", actor: "user" });
  return NextResponse.json(supplier, { status: 201 });
}
