/**
 * Smoke test for the dashboard API route.
 *
 * Tests the computeDashboardTotals function as used by the API handler.
 * We don't import the route handler directly to avoid Prisma/Next.js
 * bootstrap issues in the Vitest environment.
 *
 * Related spec: docs/spec.md §"Dashboard Totals"
 */
import { describe, it, expect } from 'vitest'
import { computeDashboardTotals } from '@/lib/calculations'

describe('dashboard API logic', () => {
  it('returns zero totals when no records exist', () => {
    const totals = computeDashboardTotals([], [], [])
    expect(totals).toEqual({ scope1: 0, scope2: 0, scope3: 0, total: 0 })
  })

  it('correctly aggregates multiple records per scope', () => {
    // Simulate what the route handler would do after fetching DB records
    const scope1Values = [45.2]
    const scope2Values = [28.7]
    const scope3Values = [312.5, 18.3, 7.8]

    const totals = computeDashboardTotals(scope1Values, scope2Values, scope3Values)

    expect(totals.scope1).toBeCloseTo(45.2, 2)
    expect(totals.scope2).toBeCloseTo(28.7, 2)
    expect(totals.scope3).toBeCloseTo(338.6, 2)
    expect(totals.total).toBeCloseTo(412.5, 2)
  })

  it('includes reporting year context in a typical API response shape', () => {
    const totals = computeDashboardTotals([100], [50], [200])
    const response = { reportingYear: 2024, ...totals }

    expect(response.reportingYear).toBe(2024)
    expect(response.scope1).toBe(100)
    expect(response.scope2).toBe(50)
    expect(response.scope3).toBe(200)
    expect(response.total).toBe(350)
  })
})
