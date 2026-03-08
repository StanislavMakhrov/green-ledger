import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEMO_COMPANY_ID, DEMO_REPORTING_YEAR } from "@/lib/constants";

export async function GET() {
  const records = await prisma.scope1Record.findMany({
    where: { companyId: DEMO_COMPANY_ID, periodYear: DEMO_REPORTING_YEAR },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(records);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    valueTco2e: number;
    calculationMethod: string;
    emissionFactorsSource: string;
    dataSource?: string;
    assumptions?: string;
    periodYear?: number;
  };

  const record = await prisma.scope1Record.create({
    data: {
      companyId: DEMO_COMPANY_ID,
      periodYear: body.periodYear ?? DEMO_REPORTING_YEAR,
      valueTco2e: body.valueTco2e,
      calculationMethod: body.calculationMethod,
      emissionFactorsSource: body.emissionFactorsSource,
      dataSource: body.dataSource ?? "manual",
      assumptions: body.assumptions,
    },
  });

  return NextResponse.json(record, { status: 201 });
}
