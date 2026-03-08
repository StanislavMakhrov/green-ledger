interface ReportData {
  companyName: string;
  reportingYear: number;
  scope1: number;
  scope2: number;
  scope3: number;
  total: number;
  scope3Categories: Array<{
    code: string;
    name: string;
    material: boolean;
    total: number;
  }>;
  methodologyNotes: Array<{
    scope: string;
    text: string;
  }>;
}

/**
 * Generates an HTML string that represents the CSRD Climate Report.
 * Returns a self-contained HTML document styled for print-to-PDF.
 * Minimal-dependency approach: no headless browser required.
 */
export function generateReportHtml(data: ReportData): string {
/** Formats a number to 2 decimal places for report display. */
function formatNumber(n: number) {
  return n.toFixed(2);
}

  const categoryRows = data.scope3Categories
    .filter((c) => c.material)
    .map(
      (c) => `
      <tr>
        <td style="padding:6px 12px;border:1px solid #ddd;">${c.code}</td>
        <td style="padding:6px 12px;border:1px solid #ddd;">${c.name}</td>
        <td style="padding:6px 12px;border:1px solid #ddd;text-align:right;">${formatNumber(c.total)}</td>
      </tr>`
    )
    .join("");

  const methodologyHtml = data.methodologyNotes
    .map(
      (n) => `
      <h3 style="color:#065f46;margin-top:16px;">${n.scope.replace("_", " ").toUpperCase()}</h3>
      <p style="white-space:pre-wrap;color:#374151;">${n.text}</p>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>CSRD Climate Report ${data.reportingYear} – ${data.companyName}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111827; margin: 40px; }
    h1 { color: #065f46; }
    h2 { color: #047857; border-bottom: 2px solid #d1fae5; padding-bottom: 4px; }
    table { border-collapse: collapse; width: 100%; margin-top: 12px; }
    th { background: #d1fae5; padding: 8px 12px; border: 1px solid #a7f3d0; text-align: left; }
    .kpi { display: inline-block; min-width: 140px; padding: 16px; margin: 8px;
           border: 1px solid #a7f3d0; border-radius: 8px; background: #f0fdf4; }
    .kpi-label { font-size: 12px; color: #6b7280; }
    .kpi-value { font-size: 24px; font-weight: bold; color: #065f46; }
    @media print { @page { margin: 20mm; } }
  </style>
</head>
<body>
  <h1>CSRD Climate Report</h1>
  <p><strong>Company:</strong> ${data.companyName}</p>
  <p><strong>Reporting Year:</strong> ${data.reportingYear}</p>
  <p><strong>Standard:</strong> CSRD / ESRS E1 – Climate Change</p>

  <h2>Summary</h2>
  <div>
    <div class="kpi">
      <div class="kpi-label">Scope 1 (tCO₂e)</div>
      <div class="kpi-value">${formatNumber(data.scope1)}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Scope 2 (tCO₂e)</div>
      <div class="kpi-value">${formatNumber(data.scope2)}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Scope 3 (tCO₂e)</div>
      <div class="kpi-value">${formatNumber(data.scope3)}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Total (tCO₂e)</div>
      <div class="kpi-value">${formatNumber(data.total)}</div>
    </div>
  </div>

  <table style="margin-top:20px;max-width:400px;">
    <thead>
      <tr>
        <th>Category</th>
        <th style="text-align:right;">tCO₂e</th>
      </tr>
    </thead>
    <tbody>
      <tr><td style="padding:6px 12px;border:1px solid #ddd;">Scope 1</td>
          <td style="padding:6px 12px;border:1px solid #ddd;text-align:right;">${formatNumber(data.scope1)}</td></tr>
      <tr><td style="padding:6px 12px;border:1px solid #ddd;">Scope 2</td>
          <td style="padding:6px 12px;border:1px solid #ddd;text-align:right;">${formatNumber(data.scope2)}</td></tr>
      <tr><td style="padding:6px 12px;border:1px solid #ddd;">Scope 3</td>
          <td style="padding:6px 12px;border:1px solid #ddd;text-align:right;">${formatNumber(data.scope3)}</td></tr>
      <tr style="font-weight:bold;">
          <td style="padding:6px 12px;border:1px solid #ddd;">Total</td>
          <td style="padding:6px 12px;border:1px solid #ddd;text-align:right;">${formatNumber(data.total)}</td></tr>
    </tbody>
  </table>

  <h2>Scope 3 Breakdown – Material Categories</h2>
  <table>
    <thead>
      <tr>
        <th>Code</th>
        <th>Category</th>
        <th style="text-align:right;">tCO₂e</th>
      </tr>
    </thead>
    <tbody>
      ${categoryRows || '<tr><td colspan="3" style="padding:8px;text-align:center;color:#9ca3af;">No material categories recorded</td></tr>'}
    </tbody>
  </table>

  <h2>Methodology</h2>
  ${methodologyHtml || '<p style="color:#9ca3af;">No methodology notes recorded.</p>'}

  <h2>Assumptions &amp; Data Quality</h2>
  <p>
    Emission calculations follow GHG Protocol Corporate Standard.
    Scope 3 supplier data collected via direct supplier forms; proxy factors
    applied where direct data is unavailable (DEFRA 2023 spend-based conversion factors).
    Confidence scores range from 0.6 (proxy) to 0.8 (activity-based) to 1.0 (supplier-specific).
  </p>

  <p style="margin-top:40px;font-size:11px;color:#9ca3af;">
    Generated by GreenLedger on ${new Date().toISOString().split("T")[0]}.
    This report is for internal use and CSRD compliance preparation.
  </p>
</body>
</html>`;
}
