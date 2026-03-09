/**
 * PDF report HTML template generator.
 * Produces a self-contained HTML string with inline CSS suitable for
 * rendering via Puppeteer into a print-ready PDF.
 */

export interface ReportData {
  companyName: string;
  reportingYear: number;
  scope1Total: number;
  scope2Total: number;
  scope3Total: number;
  total: number;
  scope3Categories: Array<{
    code: string;
    name: string;
    valueTco2e: number;
  }>;
  methodologyNotes: Array<{
    scope: string;
    text: string;
  }>;
  dataQualityItems: Array<{
    categoryName: string;
    valueTco2e: number;
    dataSource: string;
    confidence: number;
    assumptions: string | null;
  }>;
}

function fmt(value: number): string {
  return value.toFixed(2);
}

function scopeLabel(scope: string): string {
  const labels: Record<string, string> = {
    scope_1: "Scope 1",
    scope_2: "Scope 2",
    scope_3: "Scope 3",
  };
  return labels[scope] ?? scope;
}

/**
 * Returns a complete HTML document as a string for the CSRD climate report.
 * Uses only inline CSS — no external CDN calls — so it renders correctly
 * in a sandboxed Puppeteer environment.
 */
export function generateReportHTML(data: ReportData): string {
  const generatedDate = new Date().toLocaleDateString("en-GB", {
    dateStyle: "long",
  });

  const scope3BreakdownRows = data.scope3Categories
    .map(
      (cat) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-family:monospace;font-size:12px;color:#6b7280;">${cat.code}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${cat.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">${fmt(cat.valueTco2e)}</td>
      </tr>`
    )
    .join("");

  const methodologySection = data.methodologyNotes
    .map(
      (note) => `
      <div style="margin-bottom:24px;">
        <h3 style="font-size:14px;font-weight:600;color:#15803d;margin:0 0 8px 0;">${scopeLabel(note.scope)}</h3>
        <p style="font-size:13px;color:#374151;line-height:1.6;margin:0;white-space:pre-wrap;">${note.text}</p>
      </div>`
    )
    .join("");

  const dataQualityRows = data.dataQualityItems
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${item.categoryName}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${fmt(item.valueTco2e)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${item.dataSource}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.confidence.toFixed(1)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;">${item.assumptions ?? "—"}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GreenLedger Climate Report ${data.reportingYear}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; background: white; }
    @page { size: A4; margin: 20mm 15mm; }
    .page-break { page-break-before: always; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f9fafb; font-weight: 600; color: #374151; }
  </style>
</head>
<body>

<!-- ═══════════════════════════════════════════════════════ COVER PAGE -->
<div style="min-height:100vh;display:flex;flex-direction:column;justify-content:center;padding:60px 40px;background:linear-gradient(135deg,#14532d 0%,#15803d 60%,#16a34a 100%);">
  <div style="margin-bottom:40px;">
    <div style="font-size:48px;margin-bottom:12px;">🌿</div>
    <div style="font-size:20px;color:#86efac;font-weight:500;letter-spacing:2px;text-transform:uppercase;">GreenLedger</div>
  </div>
  <div>
    <h1 style="font-size:40px;font-weight:800;color:white;line-height:1.2;margin-bottom:16px;">
      CSRD Climate<br>Report
    </h1>
    <div style="width:60px;height:4px;background:#4ade80;margin-bottom:24px;"></div>
    <p style="font-size:22px;color:#bbf7d0;font-weight:500;margin-bottom:8px;">${data.companyName}</p>
    <p style="font-size:18px;color:#86efac;">Reporting Year: ${data.reportingYear}</p>
  </div>
  <div style="margin-top:auto;padding-top:60px;">
    <p style="font-size:13px;color:#4ade80;">Generated: ${generatedDate}</p>
    <p style="font-size:12px;color:#16a34a;margin-top:4px;">Prepared in accordance with GHG Protocol Corporate Standard</p>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════════ SUMMARY -->
<div class="page-break" style="padding:40px;">
  <div style="margin-bottom:32px;padding-bottom:16px;border-bottom:3px solid #15803d;">
    <h2 style="font-size:24px;font-weight:700;color:#14532d;">Emissions Summary</h2>
    <p style="font-size:14px;color:#6b7280;margin-top:4px;">Reporting Year ${data.reportingYear} — All values in tCO₂e</p>
  </div>

  <table style="margin-bottom:32px;">
    <thead>
      <tr>
        <th style="text-align:left;padding:12px;border-bottom:2px solid #15803d;">Scope</th>
        <th style="text-align:left;padding:12px;border-bottom:2px solid #15803d;">Description</th>
        <th style="text-align:right;padding:12px;border-bottom:2px solid #15803d;">tCO₂e</th>
        <th style="text-align:right;padding:12px;border-bottom:2px solid #15803d;">% of Total</th>
      </tr>
    </thead>
    <tbody>
      <tr style="background:#fff7ed;">
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;font-weight:600;">🔥 Scope 1</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">Direct emissions</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">${fmt(data.scope1Total)}</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right;color:#6b7280;">
          ${data.total > 0 ? ((data.scope1Total / data.total) * 100).toFixed(1) : "0.0"}%
        </td>
      </tr>
      <tr style="background:#fefce8;">
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;font-weight:600;">⚡ Scope 2</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">Purchased energy</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">${fmt(data.scope2Total)}</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right;color:#6b7280;">
          ${data.total > 0 ? ((data.scope2Total / data.total) * 100).toFixed(1) : "0.0"}%
        </td>
      </tr>
      <tr style="background:#eff6ff;">
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;font-weight:600;">🔗 Scope 3</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">Value chain</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">${fmt(data.scope3Total)}</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right;color:#6b7280;">
          ${data.total > 0 ? ((data.scope3Total / data.total) * 100).toFixed(1) : "0.0"}%
        </td>
      </tr>
      <tr style="background:#f0fdf4;">
        <td style="padding:14px 12px;font-weight:700;color:#14532d;">Total</td>
        <td style="padding:14px 12px;color:#6b7280;">Scope 1 + 2 + 3</td>
        <td style="padding:14px 12px;text-align:right;font-weight:700;font-size:18px;color:#14532d;">${fmt(data.total)}</td>
        <td style="padding:14px 12px;text-align:right;font-weight:600;">100%</td>
      </tr>
    </tbody>
  </table>

  <!-- Scope 3 Category Breakdown -->
  ${
    data.scope3Categories.length > 0
      ? `
  <h3 style="font-size:18px;font-weight:600;color:#14532d;margin-bottom:16px;">Scope 3 Category Breakdown</h3>
  <table>
    <thead>
      <tr>
        <th style="text-align:left;padding:10px 12px;border-bottom:2px solid #15803d;">Code</th>
        <th style="text-align:left;padding:10px 12px;border-bottom:2px solid #15803d;">Category</th>
        <th style="text-align:right;padding:10px 12px;border-bottom:2px solid #15803d;">tCO₂e</th>
      </tr>
    </thead>
    <tbody>
      ${scope3BreakdownRows}
    </tbody>
  </table>`
      : `<p style="color:#6b7280;font-style:italic;font-size:14px;">No material Scope 3 categories with data recorded.</p>`
  }
</div>

<!-- ═══════════════════════════════════════════════════════ METHODOLOGY -->
<div class="page-break" style="padding:40px;">
  <div style="margin-bottom:32px;padding-bottom:16px;border-bottom:3px solid #15803d;">
    <h2 style="font-size:24px;font-weight:700;color:#14532d;">Methodology</h2>
    <p style="font-size:14px;color:#6b7280;margin-top:4px;">Calculation approach and emission factor sources</p>
  </div>

  ${
    data.methodologyNotes.length > 0
      ? methodologySection
      : `<p style="color:#6b7280;font-style:italic;">No methodology notes recorded.</p>`
  }
</div>

<!-- ═══════════════════════════════════════════════════════ DATA QUALITY -->
<div class="page-break" style="padding:40px;">
  <div style="margin-bottom:32px;padding-bottom:16px;border-bottom:3px solid #15803d;">
    <h2 style="font-size:24px;font-weight:700;color:#14532d;">Assumptions &amp; Data Quality</h2>
    <p style="font-size:14px;color:#6b7280;margin-top:4px;">
      Records using proxy data, low confidence, or with notable assumptions
    </p>
  </div>

  ${
    data.dataQualityItems.length > 0
      ? `<table>
    <thead>
      <tr>
        <th style="text-align:left;padding:10px 12px;border-bottom:2px solid #15803d;">Category</th>
        <th style="text-align:right;padding:10px 12px;border-bottom:2px solid #15803d;">tCO₂e</th>
        <th style="text-align:left;padding:10px 12px;border-bottom:2px solid #15803d;">Data Source</th>
        <th style="text-align:center;padding:10px 12px;border-bottom:2px solid #15803d;">Confidence</th>
        <th style="text-align:left;padding:10px 12px;border-bottom:2px solid #15803d;">Assumptions</th>
      </tr>
    </thead>
    <tbody>
      ${dataQualityRows}
    </tbody>
  </table>`
      : `<p style="color:#6b7280;font-style:italic;">All records have high confidence and no proxy estimations.</p>`
  }

  <!-- Footer -->
  <div style="margin-top:48px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;">
    <p style="font-size:12px;color:#9ca3af;">
      🌿 GreenLedger · CSRD Climate Report · ${data.companyName} · ${data.reportingYear}
    </p>
    <p style="font-size:11px;color:#d1d5db;margin-top:4px;">
      Generated on ${generatedDate} · For internal use and regulatory submission
    </p>
  </div>
</div>

</body>
</html>`;
}
