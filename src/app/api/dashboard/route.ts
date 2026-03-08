import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEMO_COMPANY_ID, DEMO_REPORTING_YEAR } from "@/lib/constants";

export async function GET() {
  const [scope1Records, scope2Records, scope3Records] = await Promise.all([
    prisma.scope1Record.findMany({
      where: { companyId: DEMO_COMPANY_ID, periodYear: DEMO_REPORTING_YEAR },
      select: { valueTco2e: true },
    }),
    prisma.scope2Record.findMany({
      where: { companyId: DEMO_COMPANY_ID, periodYear: DEMO_REPORTING_YEAR },
      select: { valueTco2e: true },
    }),
    prisma.scope3Record.findMany({
      where: { companyId: DEMO_COMPANY_ID, periodYear: DEMO_REPORTING_YEAR },
      select: { valueTco2e: true },
    }),
  ]);

  const scope1 = scope1Records.reduce((s, r) => s + r.valueTco2e, 0);
  const scope2 = scope2Records.reduce((s, r) => s + r.valueTco2e, 0);
  const scope3 = scope3Records.reduce((s, r) => s + r.valueTco2e, 0);

  return NextResponse.json({
    scope1,
    scope2,
    scope3,
    total: scope1 + scope2 + scope3,
  });
}
