import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";

export async function GET() {
  const company = await prisma.company.findUnique({
    where: { id: DEMO_COMPANY_ID },
  });

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const year = company.reportingYear;

  const [scope1Records, scope2Records, scope3Records] = await Promise.all([
    prisma.scope1Record.findMany({
      where: { companyId: DEMO_COMPANY_ID, periodYear: year },
    }),
    prisma.scope2Record.findMany({
      where: { companyId: DEMO_COMPANY_ID, periodYear: year },
    }),
    prisma.scope3Record.findMany({
      where: { companyId: DEMO_COMPANY_ID, periodYear: year },
    }),
  ]);

  const scope1Total = scope1Records.reduce((s, r) => s + r.valueTco2e, 0);
  const scope2Total = scope2Records.reduce((s, r) => s + r.valueTco2e, 0);
  const scope3Total = scope3Records.reduce((s, r) => s + r.valueTco2e, 0);
  const total = scope1Total + scope2Total + scope3Total;

  return NextResponse.json({
    scope1Total,
    scope2Total,
    scope3Total,
    total,
    reportingYear: year,
  });
}
