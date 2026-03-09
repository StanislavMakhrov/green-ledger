import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import { generateReport } from "@/lib/pdf";

export async function GET() {
  const [
    company,
    scope1Records,
    scope2Records,
    scope3Records,
    categories,
    methodologyNotes,
  ] = await Promise.all([
    prisma.company.findUnique({ where: { id: DEMO_COMPANY_ID } }),
    prisma.scope1Record.findMany({ where: { companyId: DEMO_COMPANY_ID } }),
    prisma.scope2Record.findMany({ where: { companyId: DEMO_COMPANY_ID } }),
    prisma.scope3Record.findMany({
      where: { companyId: DEMO_COMPANY_ID },
      include: { category: true, supplier: true },
    }),
    prisma.scope3Category.findMany({ orderBy: { code: "asc" } }),
    prisma.methodologyNote.findMany({ where: { companyId: DEMO_COMPANY_ID } }),
  ]);

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const year = company.reportingYear;
  const yearRecords1 = scope1Records.filter((r) => r.periodYear === year);
  const yearRecords2 = scope2Records.filter((r) => r.periodYear === year);
  const yearRecords3 = scope3Records.filter((r) => r.periodYear === year);

  const scope1Total = yearRecords1.reduce((s, r) => s + r.valueTco2e, 0);
  const scope2Total = yearRecords2.reduce((s, r) => s + r.valueTco2e, 0);
  const scope3Total = yearRecords3.reduce((s, r) => s + r.valueTco2e, 0);

  const pdfBuffer = await generateReport({
    company,
    scope1Total,
    scope2Total,
    scope3Total,
    grandTotal: scope1Total + scope2Total + scope3Total,
    scope3Records: yearRecords3 as Parameters<typeof generateReport>[0]["scope3Records"],
    scope3Categories: categories,
    methodologyNotes,
  });

  await prisma.auditTrailEvent.create({
    data: {
      companyId: DEMO_COMPANY_ID,
      entityType: "export",
      entityId: DEMO_COMPANY_ID,
      action: "exported",
      actor: "user",
      comment: "PDF CSRD Climate Report exported",
    },
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="GreenLedger_CSRD_Report_${year}.pdf"`,
    },
  });
}
