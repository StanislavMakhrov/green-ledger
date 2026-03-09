import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import { calculateDashboardTotals } from "@/lib/emissions";

export async function GET() {
  try {
    const company = await prisma.company.findUniqueOrThrow({
      where: { id: DEMO_COMPANY_ID },
    });
    const [s1, s2, s3] = await Promise.all([
      prisma.scope1Record.findMany({ where: { companyId: DEMO_COMPANY_ID, periodYear: company.reportingYear } }),
      prisma.scope2Record.findMany({ where: { companyId: DEMO_COMPANY_ID, periodYear: company.reportingYear } }),
      prisma.scope3Record.findMany({ where: { companyId: DEMO_COMPANY_ID, periodYear: company.reportingYear } }),
    ]);
    const totals = calculateDashboardTotals(s1, s2, s3);
    return NextResponse.json({ ...totals, reportingYear: company.reportingYear, companyName: company.name });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}
