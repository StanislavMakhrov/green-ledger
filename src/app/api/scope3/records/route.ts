import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";

export async function GET() {
  const records = await prisma.scope3Record.findMany({
    where: { companyId: DEMO_COMPANY_ID },
    include: { category: true, supplier: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(records);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    categoryId: string;
    periodYear: number;
    valueTco2e: number;
    calculationMethod: string;
    emissionFactorSource: string;
    dataSource: string;
    assumptions?: string;
    confidence: number;
    supplierId?: string;
    activityDataJson?: Record<string, unknown>;
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
      activityDataJson: body.activityDataJson != null ? JSON.stringify(body.activityDataJson) : null,
    },
  });

  await prisma.auditTrailEvent.create({
    data: {
      companyId: DEMO_COMPANY_ID,
      entityType: "scope3",
      entityId: record.id,
      action: "created",
      actor: "user",
    },
  });

  return NextResponse.json(record, { status: 201 });
}
