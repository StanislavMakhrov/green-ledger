import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";

export async function GET() {
  const company = await prisma.company.findUnique({
    where: { id: DEMO_COMPANY_ID },
  });

  const year = company?.reportingYear ?? new Date().getFullYear();

  const [scope1Agg, scope2Agg, scope3Agg] = await Promise.all([
    prisma.scope1Record.aggregate({
      where: { companyId: DEMO_COMPANY_ID, periodYear: year },
      _sum: { valueTco2e: true },
    }),
    prisma.scope2Record.aggregate({
      where: { companyId: DEMO_COMPANY_ID, periodYear: year },
      _sum: { valueTco2e: true },
    }),
    prisma.scope3Record.aggregate({
      where: { companyId: DEMO_COMPANY_ID, periodYear: year },
      _sum: { valueTco2e: true },
    }),
  ]);

  const scope1 = scope1Agg._sum.valueTco2e ?? 0;
  const scope2 = scope2Agg._sum.valueTco2e ?? 0;
  const scope3 = scope3Agg._sum.valueTco2e ?? 0;

  return NextResponse.json({
    scope1,
    scope2,
    scope3,
    total: scope1 + scope2 + scope3,
    year,
    company: company
      ? { id: company.id, name: company.name, reportingYear: company.reportingYear }
      : null,
  });
}
