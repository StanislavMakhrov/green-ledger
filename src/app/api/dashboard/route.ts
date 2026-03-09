import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const company = await prisma.company.findUnique({
      where: { id: DEMO_COMPANY_ID },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const year = company.reportingYear;

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
    const total = scope1 + scope2 + scope3;

    return NextResponse.json({
      scope1,
      scope2,
      scope3,
      total,
      reportingYear: year,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
