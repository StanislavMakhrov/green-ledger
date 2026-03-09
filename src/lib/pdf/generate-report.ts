import { PrismaClient } from "@prisma/client";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { DEMO_COMPANY_ID } from "../constants";
import {
  ReportData,
  ReportScope3Category,
  ReportAssumptionRecord,
  ReportDocument,
} from "./report-template";

// ─────────────────────────────────────────────────────────────────────────────
// PDF Report Generator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates the CSRD Climate Report PDF buffer.
 * Queries all required data from the database, assembles the ReportData object,
 * renders the React-PDF template, and returns the resulting PDF buffer.
 *
 * @param prisma - The Prisma client instance
 * @returns PDF binary buffer suitable for HTTP response
 */
export async function generateReport(prisma: PrismaClient): Promise<Buffer> {
  // 1. Fetch company data
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: DEMO_COMPANY_ID },
  });

  // 2. Compute scope totals for the reporting year
  const scope1Agg = await prisma.scope1Record.aggregate({
    where: { companyId: DEMO_COMPANY_ID, periodYear: company.reportingYear },
    _sum: { valueTco2e: true },
  });

  const scope2Agg = await prisma.scope2Record.aggregate({
    where: { companyId: DEMO_COMPANY_ID, periodYear: company.reportingYear },
    _sum: { valueTco2e: true },
  });

  const scope3Agg = await prisma.scope3Record.aggregate({
    where: { companyId: DEMO_COMPANY_ID, periodYear: company.reportingYear },
    _sum: { valueTco2e: true },
  });

  const scope1Total = scope1Agg._sum.valueTco2e ?? 0;
  const scope2Total = scope2Agg._sum.valueTco2e ?? 0;
  const scope3Total = scope3Agg._sum.valueTco2e ?? 0;
  const total = scope1Total + scope2Total + scope3Total;

  // 3. Fetch material categories with their record totals
  const materialCategories = await prisma.scope3Category.findMany({
    where: { material: true },
    include: {
      records: {
        where: {
          companyId: DEMO_COMPANY_ID,
          periodYear: company.reportingYear,
        },
      },
    },
    orderBy: { code: "asc" },
  });

  const scope3Categories: ReportScope3Category[] = materialCategories.map(
    (cat) => ({
      code: cat.code,
      name: cat.name,
      material: cat.material,
      totalTco2e: cat.records.reduce((sum, r) => sum + r.valueTco2e, 0),
    })
  );

  // 4. Check if non-material categories have records
  const nonMaterialRecordCount = await prisma.scope3Record.count({
    where: {
      companyId: DEMO_COMPANY_ID,
      periodYear: company.reportingYear,
      category: { material: false },
    },
  });

  // 5. Fetch methodology notes
  const notes = await prisma.methodologyNote.findMany({
    where: { companyId: DEMO_COMPANY_ID },
  });

  const methodologyScope1 =
    notes.find((n) => n.scope === "scope_1")?.text ?? "";
  const methodologyScope2 =
    notes.find((n) => n.scope === "scope_2")?.text ?? "";
  const methodologyScope3 =
    notes.find((n) => n.scope === "scope_3")?.text ?? "";

  // 6. Fetch records with assumptions / low confidence / proxy source
  const flaggedRecords = await prisma.scope3Record.findMany({
    where: {
      companyId: DEMO_COMPANY_ID,
      periodYear: company.reportingYear,
      OR: [
        { confidence: { lt: 1.0 } },
        { dataSource: "proxy" },
        { assumptions: { not: null } },
      ],
    },
    include: {
      supplier: true,
      category: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const assumptionRecords: ReportAssumptionRecord[] = flaggedRecords.map(
    (rec) => ({
      supplierName: rec.supplier?.name ?? "—",
      categoryCode: rec.category.code,
      categoryName: rec.category.name,
      assumptions: rec.assumptions ?? "",
      confidence: rec.confidence,
      dataSource: rec.dataSource,
      valueTco2e: rec.valueTco2e,
    })
  );

  // 7. Build ReportData
  const reportData: ReportData = {
    companyName: company.name,
    reportingYear: company.reportingYear,
    scope1Total,
    scope2Total,
    scope3Total,
    total,
    scope3Categories,
    hasNonMaterialRecords: nonMaterialRecordCount > 0,
    methodologyScope1,
    methodologyScope2,
    methodologyScope3,
    assumptionRecords,
    generatedAt: new Date().toISOString().split("T")[0],
  };

  // 8. Render to PDF buffer
  // Cast is needed because @react-pdf/renderer's type definitions require DocumentProps
  // but our component wraps Document internally (using require to avoid bundling issues).
  const element = React.createElement(ReportDocument, { data: reportData });
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const buffer = await renderToBuffer(element as any);
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return Buffer.from(buffer);
}
