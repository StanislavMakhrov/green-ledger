import { NextResponse } from "next/server";
import { getDemoCompany } from "@/lib/company";
import { prisma } from "@/lib/prisma";

/** GET /api/dashboard — returns scope totals for the demo company. */
export async function GET() {
  const company = await getDemoCompany();
  if (!company) {
    return NextResponse.json({ error: "No company found" }, { status: 404 });
  }

  const year = company.reportingYear;

  const [scope1Records, scope2Records, scope3Records] = await Promise.all([
    prisma.scope1Record.findMany({
      where: { companyId: company.id, periodYear: year },
    }),
    prisma.scope2Record.findMany({
      where: { companyId: company.id, periodYear: year },
    }),
    prisma.scope3Record.findMany({
      where: { companyId: company.id, periodYear: year },
    }),
  ]);

  const scope1 = scope1Records.reduce((sum, r) => sum + r.valueTco2e, 0);
  const scope2 = scope2Records.reduce((sum, r) => sum + r.valueTco2e, 0);
  const scope3 = scope3Records.reduce((sum, r) => sum + r.valueTco2e, 0);
  const total = scope1 + scope2 + scope3;

  return NextResponse.json({
    companyName: company.name,
    reportingYear: year,
    scope1: Math.round(scope1 * 100) / 100,
    scope2: Math.round(scope2 * 100) / 100,
    scope3: Math.round(scope3 * 100) / 100,
    total: Math.round(total * 100) / 100,
  });
}
