import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEMO_COMPANY_ID, DEMO_REPORTING_YEAR } from "@/lib/constants";
import { generateReportHtml } from "@/lib/pdf";

export async function GET() {
  const [company, scope1Records, scope2Records, scope3Records, categories, notes] =
    await Promise.all([
      prisma.company.findUnique({ where: { id: DEMO_COMPANY_ID } }),
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
        select: { valueTco2e: true, categoryId: true },
      }),
      prisma.scope3Category.findMany({ orderBy: { code: "asc" } }),
      prisma.methodologyNote.findMany({
        where: { companyId: DEMO_COMPANY_ID },
      }),
    ]);

  const scope1 = scope1Records.reduce((s, r) => s + r.valueTco2e, 0);
  const scope2 = scope2Records.reduce((s, r) => s + r.valueTco2e, 0);
  const scope3 = scope3Records.reduce((s, r) => s + r.valueTco2e, 0);

  // Build per-category totals
  const categoryTotals = new Map<string, number>();
  for (const r of scope3Records) {
    categoryTotals.set(r.categoryId, (categoryTotals.get(r.categoryId) ?? 0) + r.valueTco2e);
  }

  const scope3CategoriesData = categories.map((c) => ({
    code: c.code,
    name: c.name,
    material: c.material,
    total: categoryTotals.get(c.id) ?? 0,
  }));

  const html = generateReportHtml({
    companyName: company?.name ?? "Unknown Company",
    reportingYear: DEMO_REPORTING_YEAR,
    scope1,
    scope2,
    scope3,
    total: scope1 + scope2 + scope3,
    scope3Categories: scope3CategoriesData,
    methodologyNotes: notes,
  });

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": 'attachment; filename="csrd-report.html"',
    },
  });
}
