import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import { createAuditEvent } from "@/lib/audit";

export async function GET() {
  const records = await prisma.scope3Record.findMany({
    where: { companyId: DEMO_COMPANY_ID },
    include: { supplier: true, category: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(records);
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    supplierId?: string;
    categoryId: string;
    periodYear: number;
    valueTco2e: number;
    calculationMethod: string;
    emissionFactorSource: string;
    dataSource: string;
    assumptions?: string;
    confidence: number;
    activityDataJson?: string;
  };

  const record = await prisma.scope3Record.create({
    data: {
      companyId: DEMO_COMPANY_ID,
      supplierId: body.supplierId ?? null,
      categoryId: body.categoryId,
      periodYear: body.periodYear,
      valueTco2e: body.valueTco2e,
      calculationMethod: body.calculationMethod,
      emissionFactorSource: body.emissionFactorSource,
      dataSource: body.dataSource,
      assumptions: body.assumptions,
      confidence: body.confidence,
      activityDataJson: body.activityDataJson,
    },
  });

  await createAuditEvent({
    companyId: DEMO_COMPANY_ID,
    entityType: "scope3",
    entityId: record.id,
    action: "created",
    actor: "user",
  });

  return NextResponse.json(record, { status: 201 });
}
