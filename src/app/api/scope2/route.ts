import { NextRequest, NextResponse } from "next/server";
import { getDemoCompany } from "@/lib/company";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/audit";

/** GET /api/scope2 — list all Scope 2 records for the demo company. */
export async function GET() {
  const company = await getDemoCompany();
  if (!company) {
    return NextResponse.json({ error: "No company found" }, { status: 404 });
  }
  const records = await prisma.scope2Record.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(records);
}

/** POST /api/scope2 — create a Scope 2 record and emit an audit event. */
export async function POST(req: NextRequest) {
  const company = await getDemoCompany();
  if (!company) {
    return NextResponse.json({ error: "No company found" }, { status: 404 });
  }
  const body = await req.json();
  const record = await prisma.scope2Record.create({
    data: {
      companyId: company.id,
      periodYear: body.periodYear ?? company.reportingYear,
      valueTco2e: Number(body.valueTco2e),
      calculationMethod: body.calculationMethod ?? "",
      emissionFactorsSource: body.emissionFactorsSource ?? "",
      dataSource: "manual",
      assumptions: body.assumptions ?? null,
    },
  });
  await createAuditEvent({
    companyId: company.id,
    entityType: "scope2",
    entityId: record.id,
    action: "created",
    actor: "user",
  });
  return NextResponse.json(record, { status: 201 });
}
