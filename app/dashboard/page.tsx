/**
 * Dashboard page — displays KPI cards for Scope 1, Scope 2, Scope 3 and
 * the grand total for the reporting year.
 *
 * Server component: fetches data directly via Prisma (no client-side fetch).
 *
 * Related spec: docs/spec.md §"Dashboard Totals"
 */
import { prisma } from '@/lib/prisma'
import { computeDashboardTotals } from '@/lib/calculations'
import { KpiCard } from '@/components/KpiCard'

export default async function DashboardPage() {
  const company = await prisma.company.findFirst()
  if (!company) {
    return <p className="text-red-600">No company data found. Please run the seed.</p>
  }

  const [s1, s2, s3] = await Promise.all([
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
    s1.map((r) => r.valueTco2e),
    s2.map((r) => r.valueTco2e),
    s3.map((r) => r.valueTco2e),
  )

  const fmt = (v: number) => v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          {company.name} — Reporting Year: <strong>{company.reportingYear}</strong>
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          title="Scope 1 Total"
          value={fmt(totals.scope1)}
          icon="🔥"
          accent="orange"
          description="Direct emissions"
        />
        <KpiCard
          title="Scope 2 Total"
          value={fmt(totals.scope2)}
          icon="⚡"
          accent="blue"
          description="Purchased energy"
        />
        <KpiCard
          title="Scope 3 Total"
          value={fmt(totals.scope3)}
          icon="🌍"
          accent="green"
          description="Value chain emissions"
        />
        <KpiCard
          title="Grand Total"
          value={fmt(totals.total)}
          icon="📊"
          accent="purple"
          description="Scope 1 + 2 + 3"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Inventory Breakdown</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 font-medium text-gray-500">Scope</th>
              <th className="text-right py-2 font-medium text-gray-500">tCO₂e</th>
              <th className="text-right py-2 font-medium text-gray-500">Share</th>
            </tr>
          </thead>
          <tbody>
            {[
              { label: 'Scope 1 — Direct', value: totals.scope1 },
              { label: 'Scope 2 — Purchased Energy', value: totals.scope2 },
              { label: 'Scope 3 — Value Chain', value: totals.scope3 },
            ].map((row) => (
              <tr key={row.label} className="border-b border-gray-100">
                <td className="py-2 text-gray-700">{row.label}</td>
                <td className="py-2 text-right font-mono">{fmt(row.value)}</td>
                <td className="py-2 text-right text-gray-400">
                  {totals.total > 0 ? ((row.value / totals.total) * 100).toFixed(1) + ' %' : '—'}
                </td>
              </tr>
            ))}
            <tr className="font-bold">
              <td className="py-2 text-gray-900">Total</td>
              <td className="py-2 text-right font-mono">{fmt(totals.total)}</td>
              <td className="py-2 text-right">100 %</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
