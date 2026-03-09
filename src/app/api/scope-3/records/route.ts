import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import { createAuditEvent } from "@/lib/audit";

export async function GET() {
  const records = await prisma.scope3Record.findMany({
    where: { companyId: DEMO_COMPANY_ID },
    include: { category: true, supplier: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(records);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { supplierId, categoryId, periodYear, valueTco2e, calculationMethod, emissionFactorSource, dataSource, assumptions, confidence, activityDataJson } = body;
  if (!categoryId || !periodYear || valueTco2e == null || !calculationMethod || !emissionFactorSource || !dataSource || confidence == null)
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  const record = await prisma.scope3Record.create({
    data: {
      companyId: DEMO_COMPANY_ID,
      supplierId: supplierId ?? null,
      categoryId,
      periodYear: Number(periodYear),
      valueTco2e: Number(valueTco2e),
      calculationMethod,
      emissionFactorSource,
      dataSource,
      assumptions,
      confidence: Number(confidence),
      activityDataJson: activityDataJson ? JSON.stringify(activityDataJson) : null,
    },
    include: { category: true, supplier: true },
  });
  await createAuditEvent({ companyId: DEMO_COMPANY_ID, entityType: "scope3", entityId: record.id, action: "created", actor: "user" });
  return NextResponse.json(record, { status: 201 });
}
