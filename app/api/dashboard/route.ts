/**
 * GET /api/dashboard
 *
 * Returns KPI totals (Scope 1, 2, 3, Total in tCO₂e) for the demo company's
 * reporting year.
 *
 * Related spec: docs/spec.md §"Dashboard Totals"
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { computeDashboardTotals } from '@/lib/calculations'

export async function GET() {
  const company = await prisma.company.findFirst()
  if (!company) {
    return NextResponse.json({ error: 'No company found' }, { status: 404 })
  }

  const [scope1Records, scope2Records, scope3Records] = await Promise.all([
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
      select: { valueTco2e: true },
    }),
  ])

  const totals = computeDashboardTotals(
    scope1Records.map((r) => r.valueTco2e),
    scope2Records.map((r) => r.valueTco2e),
    scope3Records.map((r) => r.valueTco2e),
  )

  return NextResponse.json({
    reportingYear: company.reportingYear,
    ...totals,
  })
}
