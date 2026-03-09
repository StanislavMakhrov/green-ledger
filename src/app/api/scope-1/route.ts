import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import { createAuditEvent } from "@/lib/audit";

export async function GET() {
  const records = await prisma.scope1Record.findMany({ where: { companyId: DEMO_COMPANY_ID }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(records);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { periodYear, valueTco2e, calculationMethod, emissionFactorsSource, dataSource, assumptions } = body;
  if (!periodYear || valueTco2e == null || !calculationMethod || !emissionFactorsSource || !dataSource)
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  const record = await prisma.scope1Record.create({
    data: { companyId: DEMO_COMPANY_ID, periodYear: Number(periodYear), valueTco2e: Number(valueTco2e), calculationMethod, emissionFactorsSource, dataSource, assumptions },
  });
  await createAuditEvent({ companyId: DEMO_COMPANY_ID, entityType: "scope1", entityId: record.id, action: "created", actor: "user" });
  return NextResponse.json(record, { status: 201 });
}
