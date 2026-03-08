/**
 * GET /api/export/pdf
 *
 * Generates and returns the CSRD Climate Report as a self-contained HTML
 * document suitable for printing to PDF via the browser's print dialog.
 *
 * The response has Content-Disposition: inline so the browser renders it
 * in a new tab; the user can then use Ctrl+P / Cmd+P → Save as PDF.
 *
 * This approach requires no headless-browser dependency (e.g. Puppeteer)
 * while still producing a professional-looking printable report.
 *
 * Related spec: docs/spec.md §"PDF Export"
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { computeDashboardTotals } from '@/lib/calculations'
import { generateReportHtml } from '@/lib/report'
import { recordAuditEvent } from '@/lib/audit'

export async function GET() {
  const company = await prisma.company.findFirst()
  if (!company) return NextResponse.json({ error: 'No company found' }, { status: 404 })

  // ── Fetch all required data ───────────────────────────────────────────────
  const [scope1, scope2, scope3, methodologyNotes] = await Promise.all([
    prisma.scope1Record.findMany({
      where: { companyId: company.id, periodYear: company.reportingYear },
      select: { valueTco2e: true },
    }),
    prisma.scope2Record.findMany({
      where: { companyId: company.id, periodYear: company.reportingYear },
      select: { valueTco2e: true },
    }),
    prisma.scope3Record.findMany({
      where: { companyId: company.id, periodYear: company.reportingYear },
      include: { category: true, supplier: { select: { name: true } } },
    }),
    prisma.methodologyNote.findMany({
      where: { companyId: company.id },
      orderBy: { scope: 'asc' },
    }),
  ])

  // ── Compute totals ────────────────────────────────────────────────────────
  const totals = computeDashboardTotals(
    scope1.map((r) => r.valueTco2e),
    scope2.map((r) => r.valueTco2e),
    scope3.map((r) => r.valueTco2e),
  )

  // ── Scope 3 breakdown (material categories only) ──────────────────────────
  const materialScope3 = scope3.filter((r) => r.category.material)
  const hasNonMaterialCategories = scope3.some((r) => !r.category.material)

  // Aggregate by category code
  const categoryMap = new Map<string, { code: string; name: string; total: number }>()
  for (const r of materialScope3) {
    const key = r.category.code
    const existing = categoryMap.get(key)
    if (existing) {
      existing.total += r.valueTco2e
    } else {
      categoryMap.set(key, { code: r.category.code, name: r.category.name, total: r.valueTco2e })
    }
  }
  const scope3Rows = Array.from(categoryMap.values())
    .sort((a, b) => a.code.localeCompare(b.code))
    .map((c) => ({ categoryCode: c.code, categoryName: c.name, valueTco2e: c.total }))

  // ── Data quality records ──────────────────────────────────────────────────
  const dataQualityRows = scope3
    .filter((r) => r.dataSource === 'proxy' || r.confidence < 1 || (r.assumptions && r.assumptions.length > 0))
    .map((r) => ({
      supplierName: r.supplier?.name ?? null,
      categoryName: r.category.name,
      dataSource: r.dataSource,
      confidence: r.confidence,
      assumptions: r.assumptions,
    }))

  // ── Generate HTML ─────────────────────────────────────────────────────────
  const html = generateReportHtml({
    company: { name: company.name, country: company.country, reportingYear: company.reportingYear },
    totals,
    scope3Rows,
    methodologyNotes: methodologyNotes.map((n) => ({ scope: n.scope, text: n.text })),
    dataQualityRows,
    hasNonMaterialCategories,
  })

  // ── Audit ─────────────────────────────────────────────────────────────────
  await recordAuditEvent(company.id, 'export', 'pdf', 'exported', 'user', 'CSRD Climate Report exported')

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': 'inline; filename="csrd-climate-report.html"',
    },
  })
}
