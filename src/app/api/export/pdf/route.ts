import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import { createAuditEvent } from "@/lib/audit";

function fmt(n: number): string {
  return n.toFixed(2);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const company = await prisma.company.findUnique({
    where: { id: DEMO_COMPANY_ID },
  });

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const year = company.reportingYear;

  const [scope1Records, scope2Records, scope3Records, categories, methodologyNotes] =
    await Promise.all([
      prisma.scope1Record.findMany({
        where: { companyId: DEMO_COMPANY_ID, periodYear: year },
      }),
      prisma.scope2Record.findMany({
        where: { companyId: DEMO_COMPANY_ID, periodYear: year },
      }),
      prisma.scope3Record.findMany({
        where: { companyId: DEMO_COMPANY_ID, periodYear: year },
        include: { category: true, supplier: true },
      }),
      prisma.scope3Category.findMany({ orderBy: { code: "asc" } }),
      prisma.methodologyNote.findMany({
        where: { companyId: DEMO_COMPANY_ID },
        orderBy: { scope: "asc" },
      }),
    ]);

  const scope1Total = scope1Records.reduce((s, r) => s + r.valueTco2e, 0);
  const scope2Total = scope2Records.reduce((s, r) => s + r.valueTco2e, 0);
  const scope3Total = scope3Records.reduce((s, r) => s + r.valueTco2e, 0);
  const total = scope1Total + scope2Total + scope3Total;

  // Scope 3 breakdown by material category
  const materialCategories = categories.filter((c) => c.material);
  const scope3ByCategory = materialCategories.map((cat) => {
    const records = scope3Records.filter((r) => r.categoryId === cat.id);
    const catTotal = records.reduce((s, r) => s + r.valueTco2e, 0);
    return { cat, catTotal, records };
  });

  // Low-confidence / proxy records
  const lowConfidenceRecords = scope3Records.filter((r) => r.confidence < 0.6 || r.dataSource === "proxy");

  await createAuditEvent({
    companyId: DEMO_COMPANY_ID,
    entityType: "export",
    entityId: DEMO_COMPANY_ID,
    action: "exported",
    actor: "user",
    comment: "PDF report exported",
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>GHG Emissions Report ${year} — ${escapeHtml(company.name)}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 40px; color: #222; }
  h1 { color: #155724; }
  h2 { color: #155724; border-bottom: 2px solid #155724; padding-bottom: 4px; margin-top: 36px; }
  h3 { color: #333; }
  table { border-collapse: collapse; width: 100%; margin-top: 12px; }
  th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
  th { background: #e8f5e9; font-weight: bold; }
  .cover { text-align: center; padding: 80px 0; }
  .cover h1 { font-size: 2.5rem; }
  .cover p { font-size: 1.2rem; color: #555; }
  .total-row td { font-weight: bold; background: #f1f8e9; }
  .low-conf td { background: #fff8e1; }
  @media print { body { margin: 20px; } }
</style>
</head>
<body>

<!-- Cover Page -->
<div class="cover">
  <h1>🌿 GHG Emissions Report</h1>
  <p><strong>${escapeHtml(company.name)}</strong></p>
  <p>Reporting Year: <strong>${year}</strong></p>
  <p>Organisation Boundary: ${escapeHtml(company.orgBoundary.replace(/_/g, " "))}</p>
  <p>Generated: ${new Date().toLocaleDateString("en-GB")}</p>
</div>

<!-- Summary Table -->
<h2>Executive Summary</h2>
<table>
  <thead><tr><th>Scope</th><th>tCO₂e</th></tr></thead>
  <tbody>
    <tr><td>Scope 1 — Direct emissions</td><td>${fmt(scope1Total)}</td></tr>
    <tr><td>Scope 2 — Indirect (energy)</td><td>${fmt(scope2Total)}</td></tr>
    <tr><td>Scope 3 — Value chain</td><td>${fmt(scope3Total)}</td></tr>
    <tr class="total-row"><td>Total</td><td>${fmt(total)}</td></tr>
  </tbody>
</table>

<!-- Scope 3 Breakdown -->
<h2>Scope 3 Breakdown — Material Categories</h2>
${
  scope3ByCategory.length === 0
    ? "<p>No material categories configured.</p>"
    : scope3ByCategory
        .map(
          ({ cat, catTotal, records }) => `
<h3>${escapeHtml(cat.code)} — ${escapeHtml(cat.name)}</h3>
<p>Total: <strong>${fmt(catTotal)} tCO₂e</strong></p>
<table>
  <thead><tr><th>Supplier</th><th>Method</th><th>Source</th><th>Confidence</th><th>tCO₂e</th></tr></thead>
  <tbody>
    ${records
      .map(
        (r) =>
          `<tr>
            <td>${escapeHtml(r.supplier?.name ?? "—")}</td>
            <td>${escapeHtml(r.calculationMethod)}</td>
            <td>${escapeHtml(r.dataSource)}</td>
            <td>${(r.confidence * 100).toFixed(0)}%</td>
            <td>${fmt(r.valueTco2e)}</td>
          </tr>`,
      )
      .join("")}
  </tbody>
</table>`,
        )
        .join("")
}

<!-- Methodology -->
<h2>Methodology</h2>
${
  methodologyNotes.length === 0
    ? "<p>No methodology notes recorded.</p>"
    : methodologyNotes
        .map(
          (n) => `
<h3>${escapeHtml(n.scope.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()))}</h3>
<p>${escapeHtml(n.text)}</p>`,
        )
        .join("")
}

<!-- Assumptions & Data Quality -->
<h2>Assumptions &amp; Data Quality</h2>
<p>Records below use proxy estimates or have confidence below 60%:</p>
${
  lowConfidenceRecords.length === 0
    ? "<p>All records meet quality threshold.</p>"
    : `<table>
  <thead><tr><th>Category</th><th>Source</th><th>Confidence</th><th>Assumptions</th><th>tCO₂e</th></tr></thead>
  <tbody>
    ${lowConfidenceRecords
      .map(
        (r) =>
          `<tr class="low-conf">
            <td>${escapeHtml(r.category.code)}</td>
            <td>${escapeHtml(r.dataSource)}</td>
            <td>${(r.confidence * 100).toFixed(0)}%</td>
            <td>${escapeHtml(r.assumptions ?? "—")}</td>
            <td>${fmt(r.valueTco2e)}</td>
          </tr>`,
      )
      .join("")}
  </tbody>
</table>`
}

</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
