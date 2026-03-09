import { prisma } from "./prisma";
import { DEMO_COMPANY_ID, PROXY_FACTOR_SOURCE } from "./constants";

export interface ReportData {
  cover: {
    companyName: string;
    reportingYear: number;
    orgBoundary: string;
    generatedDate: string;
  };
  summary: {
    scope1: number;
    scope2: number;
    scope3: number;
    total: number;
  };
  scope3Breakdown: {
    categoryName: string;
    valueTco2e: number;
    calculationMethod: string;
    dataSource: string;
  }[];
  nonMaterialExists: boolean;
  methodology: {
    scope1: string;
    scope2: string;
    scope3: string;
  };
  assumptionsDataQuality: {
    supplierName: string;
    categoryName: string;
    dataSource: string;
    confidence: number;
    assumptions: string;
  }[];
  proxyFactorSource: string;
}

/**
 * Assembles report data from the database for PDF generation.
 * This is a pure data-fetching + transformation function, separated from
 * Puppeteer rendering so it can be unit-tested without headless Chromium.
 */
export async function buildReportData(): Promise<ReportData> {
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: DEMO_COMPANY_ID },
  });

  const [scope1Records, scope2Records, scope3Records, categories, notes] =
    await Promise.all([
      prisma.scope1Record.findMany({
        where: { companyId: DEMO_COMPANY_ID, periodYear: company.reportingYear },
      }),
      prisma.scope2Record.findMany({
        where: { companyId: DEMO_COMPANY_ID, periodYear: company.reportingYear },
      }),
      prisma.scope3Record.findMany({
        where: { companyId: DEMO_COMPANY_ID, periodYear: company.reportingYear },
        include: { category: true, supplier: true },
      }),
      prisma.scope3Category.findMany({ where: { material: true } }),
      prisma.methodologyNote.findMany({ where: { companyId: DEMO_COMPANY_ID } }),
    ]);

  const scope1Total = scope1Records.reduce((s, r) => s + r.valueTco2e, 0);
  const scope2Total = scope2Records.reduce((s, r) => s + r.valueTco2e, 0);
  const scope3Total = scope3Records.reduce((s, r) => s + r.valueTco2e, 0);

  const materialCategoryIds = new Set(categories.map((c) => c.id));
  const materialScope3 = scope3Records.filter((r) =>
    materialCategoryIds.has(r.categoryId)
  );
  const nonMaterialExists = scope3Records.some(
    (r) => !materialCategoryIds.has(r.categoryId)
  );

  // Assumptions section: proxy records, low confidence, or non-empty assumptions
  const assumptionRecords = scope3Records.filter(
    (r) =>
      r.dataSource === "proxy" ||
      r.confidence < 1 ||
      (r.assumptions && r.assumptions.trim() !== "")
  );

  const scope1Note = notes.find((n) => n.scope === "scope_1");
  const scope2Note = notes.find((n) => n.scope === "scope_2");
  const scope3Note = notes.find((n) => n.scope === "scope_3");

  return {
    cover: {
      companyName: company.name,
      reportingYear: company.reportingYear,
      orgBoundary: company.orgBoundary.replace(/_/g, " "),
      generatedDate: new Date().toLocaleDateString("en-GB"),
    },
    summary: {
      scope1: scope1Total,
      scope2: scope2Total,
      scope3: scope3Total,
      total: scope1Total + scope2Total + scope3Total,
    },
    scope3Breakdown: materialScope3.map((r) => ({
      categoryName: r.category.name,
      valueTco2e: r.valueTco2e,
      calculationMethod: r.calculationMethod.replace(/_/g, " "),
      dataSource: r.dataSource.replace(/_/g, " "),
    })),
    nonMaterialExists,
    methodology: {
      scope1: scope1Note?.text ?? "No methodology note recorded.",
      scope2: scope2Note?.text ?? "No methodology note recorded.",
      scope3: scope3Note?.text ?? "No methodology note recorded.",
    },
    assumptionsDataQuality: assumptionRecords.map((r) => ({
      supplierName: r.supplier?.name ?? "—",
      categoryName: r.category.name,
      dataSource: r.dataSource.replace(/_/g, " "),
      confidence: r.confidence,
      assumptions: r.assumptions ?? "—",
    })),
    proxyFactorSource: PROXY_FACTOR_SOURCE,
  };
}

/**
 * Renders a ReportData object to an HTML string for PDF conversion.
 * Separated from data assembly and Puppeteer to enable testing of each layer.
 */
export function renderReportHtml(data: ReportData): string {
  const fmt = (n: number) => n.toFixed(2);
  const pct = (n: number) => (n * 100).toFixed(0) + "%";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  body { font-family: Arial, sans-serif; margin: 40px; color: #222; }
  h1 { color: #1a6b2d; }
  h2 { color: #1a6b2d; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
  h3 { color: #2d6b3a; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
  th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
  th { background: #e8f5e9; }
  .cover { text-align: center; margin-bottom: 60px; }
  .note { background: #f9f9f9; padding: 12px; border-left: 4px solid #1a6b2d; margin: 10px 0; }
</style>
</head>
<body>

<div class="cover">
  <h1>CSRD Climate Report</h1>
  <p><strong>${data.cover.companyName}</strong></p>
  <p>Reporting Year: ${data.cover.reportingYear}</p>
  <p>Organisational Boundary: ${data.cover.orgBoundary}</p>
  <p>Generated: ${data.cover.generatedDate}</p>
</div>

<h2>1. Emissions Summary</h2>
<table>
  <tr><th>Scope</th><th>tCO&#x2082;e</th></tr>
  <tr><td>Scope 1 (Direct)</td><td>${fmt(data.summary.scope1)}</td></tr>
  <tr><td>Scope 2 (Indirect — Location-Based)</td><td>${fmt(data.summary.scope2)}</td></tr>
  <tr><td>Scope 3 (Value Chain)</td><td>${fmt(data.summary.scope3)}</td></tr>
  <tr><td><strong>Total GHG Emissions</strong></td><td><strong>${fmt(data.summary.total)}</strong></td></tr>
</table>

<h2>2. Scope 3 Breakdown by Category (Material)</h2>
${
  data.scope3Breakdown.length === 0
    ? "<p>No Scope 3 records for material categories in the reporting year.</p>"
    : `<table>
  <tr><th>Category</th><th>tCO&#x2082;e</th><th>Method</th><th>Data Source</th></tr>
  ${data.scope3Breakdown.map((r) => `<tr><td>${r.categoryName}</td><td>${fmt(r.valueTco2e)}</td><td>${r.calculationMethod}</td><td>${r.dataSource}</td></tr>`).join("")}
</table>`
}
${data.nonMaterialExists ? '<p class="note">Note: Additional Scope 3 records exist in non-material categories and are excluded from this table.</p>' : ""}

<h2>3. Methodology</h2>
<h3>Scope 1</h3>
<div class="note">${data.methodology.scope1}</div>
<h3>Scope 2</h3>
<div class="note">${data.methodology.scope2}</div>
<h3>Scope 3</h3>
<div class="note">${data.methodology.scope3}</div>

<h2>4. Assumptions &amp; Data Quality</h2>
${
  data.assumptionsDataQuality.length === 0
    ? "<p>All Scope 3 records were submitted with full supplier-specific data (confidence = 1.0).</p>"
    : `<table>
  <tr><th>Supplier</th><th>Category</th><th>Data Source</th><th>Confidence</th><th>Assumptions</th></tr>
  ${data.assumptionsDataQuality
    .map(
      (r) =>
        `<tr><td>${r.supplierName}</td><td>${r.categoryName}</td><td>${r.dataSource}</td><td>${pct(r.confidence)}</td><td>${r.assumptions}</td></tr>`
    )
    .join("")}
</table>`
}
<p class="note">Proxy emission factor: ${data.proxyFactorSource}</p>

</body>
</html>`;
}

/**
 * Builds the full PDF report HTML by fetching data from the database.
 * Used by the PDF export API route.
 */
export async function buildReportHtml(): Promise<string> {
  const data = await buildReportData();
  return renderReportHtml(data);
}
