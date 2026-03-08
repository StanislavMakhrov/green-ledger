import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import { createAuditEvent } from "@/lib/audit";
import { randomUUID } from "crypto";

export async function GET() {
  const suppliers = await prisma.supplier.findMany({
    where: { companyId: DEMO_COMPANY_ID },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(suppliers);
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name: string;
    country: string;
    sector: string;
    contactEmail: string;
  };

  const supplier = await prisma.supplier.create({
    data: {
      companyId: DEMO_COMPANY_ID,
      name: body.name,
      country: body.country,
      sector: body.sector,
      contactEmail: body.contactEmail,
      publicFormToken: `tok-${randomUUID()}`,
      status: "active",
    },
  });

  await createAuditEvent({
    companyId: DEMO_COMPANY_ID,
    entityType: "supplier",
    entityId: supplier.id,
    action: "created",
    actor: "user",
  });

  return NextResponse.json(supplier, { status: 201 });
}
