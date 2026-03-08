/**
 * HTML report generator for the CSRD Climate Report PDF export.
 *
 * This module generates a complete HTML document with `@media print` CSS
 * that renders as a credible single-page PDF report when printed via the
 * browser (File → Print → Save as PDF) or an automated headless-browser
 * tool. The `/api/export/pdf` route returns this HTML directly.
 *
 * Sections produced (per spec §"PDF Export"):
 *  1. Cover page
 *  2. Summary table (Scope 1 / 2 / 3 / Total)
 *  3. Scope 3 breakdown by material category
 *  4. Methodology notes
 *  5. Assumptions & Data Quality
 *
 * Related spec: docs/spec.md §"PDF Export CSRD Climate Report"
 */

/** Minimal subset of Company used for the report. */
export interface ReportCompany {
  name: string
  country: string
  reportingYear: number
}

/** Aggregated scope totals for the summary table. */
export interface ReportTotals {
  scope1: number
  scope2: number
  scope3: number
  total: number
}

/** A single material Scope 3 category row in the breakdown table. */
export interface ReportScope3Row {
  categoryCode: string
  categoryName: string
  valueTco2e: number
}

/** A record flagged for the data-quality section. */
export interface ReportDataQualityRow {
  supplierName: string | null
  categoryName: string
  dataSource: string
  confidence: number
  assumptions: string | null
}

/** Full payload required to render the report. */
export interface ReportData {
  company: ReportCompany
  totals: ReportTotals
  scope3Rows: ReportScope3Row[]
  methodologyNotes: { scope: string; text: string }[]
  dataQualityRows: ReportDataQualityRow[]
  hasNonMaterialCategories: boolean
}

/**
 * Formats a tCO₂e number for display (2 decimal places, space thousands sep).
 */
function fmt(value: number): string {
  return value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/**
 * Returns a human-readable scope label.
 */
function scopeLabel(scope: string): string {
  const map: Record<string, string> = {
    scope_1: 'Scope 1',
    scope_2: 'Scope 2',
    scope_3: 'Scope 3',
  }
  return map[scope] ?? scope
}

/**
 * Returns a human-readable data-source label.
 */
function dataSourceLabel(ds: string): string {
  const map: Record<string, string> = {
    supplier_form: 'Supplier form',
    csv_import: 'CSV import',
    proxy: 'Proxy estimate',
  }
  return map[ds] ?? ds
}

/**
 * Generates the complete HTML string for the CSRD Climate Report.
 *
 * The returned HTML is self-contained (inline CSS) so it can be saved as a
 * standalone file or streamed directly from the API route.
 *
 * @param data - All data required for the report
 * @returns HTML string ready to be returned as `text/html`
 */
export function generateReportHtml(data: ReportData): string {
  const { company, totals, scope3Rows, methodologyNotes, dataQualityRows, hasNonMaterialCategories } = data

  const scope3Breakdown = scope3Rows
    .map(
      (row) => `
      <tr>
        <td>${row.categoryCode}</td>
        <td>${row.categoryName}</td>
        <td class="num">${fmt(row.valueTco2e)}</td>
      </tr>`,
    )
    .join('')

  const methodologySection = methodologyNotes
    .map(
      (note) => `
      <div class="methodology-block">
        <h4>${scopeLabel(note.scope)}</h4>
        <p>${note.text.replace(/\n/g, '<br/>')}</p>
      </div>`,
    )
    .join('')

  const dataQualityRows_ = dataQualityRows
    .map(
      (row) => `
      <tr>
        <td>${row.supplierName ?? '—'}</td>
        <td>${row.categoryName}</td>
        <td>${dataSourceLabel(row.dataSource)}</td>
        <td class="num">${(row.confidence * 100).toFixed(0)}%</td>
        <td>${row.assumptions ?? '—'}</td>
      </tr>`,
    )
    .join('')

  const nonMaterialNote = hasNonMaterialCategories
    ? '<p class="note">Note: Non-material Scope 3 categories are excluded from this breakdown in accordance with the double materiality assessment.</p>'
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>CSRD Climate Report — ${company.name} — ${company.reportingYear}</title>
  <style>
    /* ─── Base ─────────────────────────────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 11pt;
      color: #1a1a1a;
      background: #fff;
      padding: 40px 60px;
      max-width: 960px;
      margin: 0 auto;
    }
    h1 { font-size: 26pt; color: #15803d; margin-bottom: 6px; }
    h2 { font-size: 16pt; color: #15803d; margin: 36px 0 12px; border-bottom: 2px solid #dcfce7; padding-bottom: 6px; }
    h3 { font-size: 13pt; margin: 24px 0 8px; color: #166534; }
    h4 { font-size: 11pt; margin: 16px 0 4px; color: #374151; }
    p { line-height: 1.6; margin-bottom: 10px; }
    /* ─── Cover ─────────────────────────────────────────────────────────────── */
    .cover {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 220px;
      border-left: 6px solid #16a34a;
      padding-left: 24px;
      margin-bottom: 48px;
    }
    .cover .subtitle { font-size: 14pt; color: #6b7280; margin-top: 6px; }
    .cover .meta { font-size: 10pt; color: #9ca3af; margin-top: 12px; }
    /* ─── Tables ─────────────────────────────────────────────────────────────── */
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th {
      background: #15803d;
      color: #fff;
      text-align: left;
      padding: 8px 12px;
      font-size: 10pt;
      font-weight: 600;
    }
    td { padding: 7px 12px; border-bottom: 1px solid #e5e7eb; font-size: 10pt; }
    tr:nth-child(even) td { background: #f9fafb; }
    tr.total-row td { font-weight: 700; background: #f0fdf4; border-top: 2px solid #16a34a; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    /* ─── Notes / Callouts ─────────────────────────────────────────────────── */
    .note { font-size: 9pt; color: #6b7280; font-style: italic; margin-top: 8px; }
    .methodology-block { margin-bottom: 20px; }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 9pt;
      font-weight: 600;
    }
    .badge-proxy { background: #fef3c7; color: #92400e; }
    .badge-supplier { background: #dcfce7; color: #166534; }
    /* ─── Print ──────────────────────────────────────────────────────────────── */
    @media print {
      body { padding: 20px 40px; }
      h2 { page-break-before: always; }
      .cover { page-break-after: always; page-break-before: avoid; }
      table { page-break-inside: avoid; }
      @page { margin: 20mm 15mm; size: A4 portrait; }
    }
  </style>
</head>
<body>

<!-- ── 1. Cover ──────────────────────────────────────────────────────────── -->
<div class="cover">
  <h1>CSRD Climate Report</h1>
  <div class="subtitle">${company.name}</div>
  <div class="meta">
    Reporting Year: <strong>${company.reportingYear}</strong> &nbsp;|&nbsp;
    Country: <strong>${company.country}</strong> &nbsp;|&nbsp;
    Standard: <strong>ESRS E1 (Climate)</strong>
  </div>
  <div class="meta" style="margin-top: 4px;">
    Generated: <strong>${new Date().toLocaleDateString('de-DE')}</strong> &nbsp;|&nbsp;
    Unit: <strong>tCO₂e (tonnes of CO₂ equivalent)</strong>
  </div>
</div>

<!-- ── 2. Summary Table ───────────────────────────────────────────────────── -->
<h2>GHG Inventory Summary</h2>
<table>
  <thead>
    <tr><th>Scope</th><th>Description</th><th class="num">tCO₂e</th></tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Scope 1</strong></td>
      <td>Direct emissions (owned/controlled sources)</td>
      <td class="num">${fmt(totals.scope1)}</td>
    </tr>
    <tr>
      <td><strong>Scope 2</strong></td>
      <td>Indirect emissions from purchased energy (location-based)</td>
      <td class="num">${fmt(totals.scope2)}</td>
    </tr>
    <tr>
      <td><strong>Scope 3</strong></td>
      <td>Other indirect emissions (value chain)</td>
      <td class="num">${fmt(totals.scope3)}</td>
    </tr>
    <tr class="total-row">
      <td><strong>Total</strong></td>
      <td></td>
      <td class="num"><strong>${fmt(totals.total)}</strong></td>
    </tr>
  </tbody>
</table>

<!-- ── 3. Scope 3 Breakdown ──────────────────────────────────────────────── -->
<h2>Scope 3 Breakdown by Material Category</h2>
${nonMaterialNote}
<table>
  <thead>
    <tr>
      <th>Code</th>
      <th>Category</th>
      <th class="num">tCO₂e</th>
    </tr>
  </thead>
  <tbody>
    ${scope3Breakdown || '<tr><td colspan="3">No material Scope 3 records for this reporting year.</td></tr>'}
  </tbody>
</table>

<!-- ── 4. Methodology ────────────────────────────────────────────────────── -->
<h2>Calculation Methodology</h2>
${methodologySection || '<p>No methodology notes recorded.</p>'}

<!-- ── 5. Assumptions &amp; Data Quality ────────────────────────────────────── -->
<h2>Assumptions &amp; Data Quality</h2>
<p>The following records use proxy estimates, have confidence &lt; 100 %, or include documented assumptions.</p>
<table>
  <thead>
    <tr>
      <th>Supplier</th>
      <th>Category</th>
      <th>Data Source</th>
      <th class="num">Confidence</th>
      <th>Assumptions / Notes</th>
    </tr>
  </thead>
  <tbody>
    ${dataQualityRows_ || '<tr><td colspan="5">All records use primary data with full confidence.</td></tr>'}
  </tbody>
</table>

<p class="note" style="margin-top: 24px;">
  This report was generated automatically by GreenLedger. Emission factors used are placeholders
  for demonstration purposes and must be reviewed before submission to auditors or regulators.
</p>

</body>
</html>`
}
