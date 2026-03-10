import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import { NextResponse } from "next/server";

// GET /api/dashboard - returns KPI aggregates for the demo company
export async function GET() {
  try {
    const company = await prisma.company.findUnique({
      where: { id: DEMO_COMPANY_ID },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const { reportingYear } = company;
    const where = { companyId: DEMO_COMPANY_ID, periodYear: reportingYear };

    const [scope1Agg, scope2Agg, scope3Agg] = await Promise.all([
      prisma.scope1Record.aggregate({ _sum: { valueTco2e: true }, where }),
      prisma.scope2Record.aggregate({ _sum: { valueTco2e: true }, where }),
      prisma.scope3Record.aggregate({ _sum: { valueTco2e: true }, where }),
    ]);

    const scope1Total = scope1Agg._sum.valueTco2e ?? 0;
    const scope2Total = scope2Agg._sum.valueTco2e ?? 0;
    const scope3Total = scope3Agg._sum.valueTco2e ?? 0;

    return NextResponse.json({
      data: {
        scope1Total,
        scope2Total,
        scope3Total,
        total: scope1Total + scope2Total + scope3Total,
        reportingYear,
        companyName: company.name,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
