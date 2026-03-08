import { NextResponse } from "next/server";
import { getDemoCompany } from "@/lib/company";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/audit";

/**
 * GET /api/export/pdf — generates and streams an HTML climate report.
 * Using HTML export per the minimal-dependency approach; the file can be
 * printed to PDF by the browser via Ctrl+P / File → Print.
 */
export async function GET() {
  const company = await getDemoCompany();
  if (!company) {
    return NextResponse.json({ error: "No company found" }, { status: 404 });
  }

  const year = company.reportingYear;

  const [scope1Records, scope2Records, scope3Records, categories, notes] =
    await Promise.all([
      prisma.scope1Record.findMany({ where: { companyId: company.id, periodYear: year } }),
      prisma.scope2Record.findMany({ where: { companyId: company.id, periodYear: year } }),
      prisma.scope3Record.findMany({
        where: { companyId: company.id, periodYear: year },
        include: { category: true },
      }),
      prisma.scope3Category.findMany({ where: { material: true }, orderBy: { code: "asc" } }),
      prisma.methodologyNote.findMany({ where: { companyId: company.id } }),
    ]);

  const scope1 = scope1Records.reduce((s, r) => s + r.valueTco2e, 0);
  const scope2 = scope2Records.reduce((s, r) => s + r.valueTco2e, 0);
  const scope3 = scope3Records.reduce((s, r) => s + r.valueTco2e, 0);
  const total = scope1 + scope2 + scope3;

  // Aggregate Scope 3 by material category
  const s3ByCat = new Map<string, { label: string; value: number }>();
  for (const cat of categories) {
    s3ByCat.set(cat.id, { label: `${cat.code} ${cat.name}`, value: 0 });
  }
  for (const rec of scope3Records) {
    const entry = s3ByCat.get(rec.categoryId);
    if (entry) entry.value += rec.valueTco2e;
  }

  const noteMap = Object.fromEntries(notes.map((n) => [n.scope, n.text]));

  const fmt = (v: number) =>
    v.toLocaleString("en-DE", { maximumFractionDigits: 1 });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>CSRD Climate Report ${year} — ${company.name}</title>
<style>
  body{font-family:Arial,sans-serif;margin:40px;color:#1a1a1a;max-width:900px}
  h1{color:#065f46;font-size:2rem}h2{color:#065f46;margin-top:2rem}
  table{width:100%;border-collapse:collapse;margin:1rem 0}
  th,td{border:1px solid #d1fae5;padding:8px 12px;text-align:left}
  th{background:#d1fae5;font-weight:600}
  .cover{text-align:center;padding:80px 0 60px}
  .cover h1{font-size:2.5rem}.cover p{font-size:1.1rem;color:#555}
  .total-row{font-weight:bold;background:#f0fdf4}
  @media print{.pagebreak{page-break-before:always}}
  pre{white-space:pre-wrap;background:#f8fafc;padding:12px;border-radius:4px}
</style>
</head>
<body>
<div class="cover">
  <h1>CSRD Climate Report</h1>
  <p>${company.name}</p>
  <p>Reporting Year: ${year}</p>
  <p>Organisational Boundary: ${company.orgBoundary.replace("_", " ")}</p>
  <p style="margin-top:40px;color:#888;font-size:0.9rem">
    Generated ${new Date().toISOString().slice(0, 10)} · GreenLedger
  </p>
</div>

<div class="pagebreak"></div>
<h2>Summary — GHG Emissions (tCO₂e)</h2>
<table>
  <thead><tr><th>Scope</th><th>tCO₂e</th><th>Share</th></tr></thead>
  <tbody>
    <tr><td>Scope 1 — Direct</td><td>${fmt(scope1)}</td><td>${total > 0 ? ((scope1 / total) * 100).toFixed(1) + "%" : "—"}</td></tr>
    <tr><td>Scope 2 — Energy Indirect</td><td>${fmt(scope2)}</td><td>${total > 0 ? ((scope2 / total) * 100).toFixed(1) + "%" : "—"}</td></tr>
    <tr><td>Scope 3 — Value Chain</td><td>${fmt(scope3)}</td><td>${total > 0 ? ((scope3 / total) * 100).toFixed(1) + "%" : "—"}</td></tr>
    <tr class="total-row"><td>Grand Total</td><td>${fmt(total)}</td><td>100%</td></tr>
  </tbody>
</table>

<h2>Scope 3 Breakdown — Material Categories</h2>
<table>
  <thead><tr><th>Category</th><th>tCO₂e</th></tr></thead>
  <tbody>
    ${[...s3ByCat.values()]
      .map((c) => `<tr><td>${c.label}</td><td>${fmt(c.value)}</td></tr>`)
      .join("\n    ")}
  </tbody>
</table>

<div class="pagebreak"></div>
<h2>Methodology</h2>
${["scope_1", "scope_2", "scope_3"]
  .map(
    (s) => `<h3>${s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</h3>
<pre>${noteMap[s] ?? "No methodology note recorded."}</pre>`
  )
  .join("\n")}

<h2>Assumptions &amp; Data Quality</h2>
<ul>
  ${scope1Records
    .filter((r) => r.assumptions)
    .map((r) => `<li><strong>Scope 1 (${r.periodYear}):</strong> ${r.assumptions}</li>`)
    .join("\n  ")}
  ${scope2Records
    .filter((r) => r.assumptions)
    .map((r) => `<li><strong>Scope 2 (${r.periodYear}):</strong> ${r.assumptions}</li>`)
    .join("\n  ")}
  ${scope3Records
    .filter((r) => r.assumptions)
    .map((r) => `<li><strong>Scope 3:</strong> ${r.assumptions}</li>`)
    .join("\n  ")}
</ul>
</body>
</html>`;

  await createAuditEvent({
    companyId: company.id,
    entityType: "export",
    entityId: company.id,
    action: "exported",
    actor: "user",
  });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="csrd-report-${year}.html"`,
    },
  });
}
