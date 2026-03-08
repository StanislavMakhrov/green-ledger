import { NextRequest, NextResponse } from "next/server";
import { getDemoCompany } from "@/lib/company";
import { prisma } from "@/lib/prisma";

/** GET /api/scope3/records — list all Scope 3 records for the demo company. */
export async function GET() {
  const company = await getDemoCompany();
  if (!company) {
    return NextResponse.json({ error: "No company found" }, { status: 404 });
  }
  const records = await prisma.scope3Record.findMany({
    where: { companyId: company.id },
    include: {
      supplier: { select: { name: true } },
      category: { select: { code: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(records);
}

/** POST /api/scope3/records — create a Scope 3 record for the demo company. */
export async function POST(req: NextRequest) {
  const company = await getDemoCompany();
  if (!company) {
    return NextResponse.json({ error: "No company found" }, { status: 404 });
  }
  const body = await req.json();
  const record = await prisma.scope3Record.create({
    data: {
      companyId: company.id,
      supplierId: body.supplierId ?? null,
      categoryId: body.categoryId,
      periodYear: body.periodYear ?? company.reportingYear,
      valueTco2e: Number(body.valueTco2e),
      calculationMethod: body.calculationMethod ?? "spend_based",
      emissionFactorSource: body.emissionFactorSource ?? "",
      dataSource: body.dataSource ?? "proxy",
      assumptions: body.assumptions ?? null,
      confidence: Number(body.confidence ?? 0.7),
      activityDataJson: body.activityDataJson
        ? JSON.stringify(body.activityDataJson)
        : null,
    },
  });
  return NextResponse.json(record, { status: 201 });
}
