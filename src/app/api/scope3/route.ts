import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEMO_COMPANY_ID, DEMO_REPORTING_YEAR } from "@/lib/constants";

export async function GET() {
  const records = await prisma.scope3Record.findMany({
    where: { companyId: DEMO_COMPANY_ID, periodYear: DEMO_REPORTING_YEAR },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(records);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    categoryId: string;
    valueTco2e: number;
    calculationMethod: string;
    emissionFactorSource: string;
    dataSource?: string;
    assumptions?: string;
    confidence?: number;
    periodYear?: number;
    supplierId?: string;
    activityDataJson?: string;
  };

  const record = await prisma.scope3Record.create({
    data: {
      companyId: DEMO_COMPANY_ID,
      categoryId: body.categoryId,
      periodYear: body.periodYear ?? DEMO_REPORTING_YEAR,
      valueTco2e: body.valueTco2e,
      calculationMethod: body.calculationMethod,
      emissionFactorSource: body.emissionFactorSource,
      dataSource: body.dataSource ?? "proxy",
      assumptions: body.assumptions,
      confidence: body.confidence ?? 0.6,
      supplierId: body.supplierId,
      activityDataJson: body.activityDataJson,
    },
  });

  return NextResponse.json(record, { status: 201 });
}
