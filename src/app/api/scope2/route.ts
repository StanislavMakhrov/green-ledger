import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";

export async function GET() {
  const records = await prisma.scope2Record.findMany({
    where: { companyId: DEMO_COMPANY_ID },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(records);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    periodYear: number;
    valueTco2e: number;
    calculationMethod: string;
    emissionFactorsSource: string;
    dataSource?: string;
    assumptions?: string;
  };

  const record = await prisma.scope2Record.create({
    data: {
      companyId: DEMO_COMPANY_ID,
      periodYear: body.periodYear,
      valueTco2e: body.valueTco2e,
      calculationMethod: body.calculationMethod,
      emissionFactorsSource: body.emissionFactorsSource,
      dataSource: body.dataSource ?? "manual",
      assumptions: body.assumptions,
    },
  });

  await prisma.auditTrailEvent.create({
    data: {
      companyId: DEMO_COMPANY_ID,
      entityType: "scope2",
      entityId: record.id,
      action: "created",
      actor: "user",
    },
  });

  return NextResponse.json(record, { status: 201 });
}
