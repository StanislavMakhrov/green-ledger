/**
 * Tests for lib/calculations.ts
 *
 * Uses Vitest with globals enabled (see vitest.config.ts).
 */
import { describe, it, expect } from 'vitest'
import {
  PROXY_FACTOR,
  calcTco2eFromSpend,
  calcTco2eFromTonKm,
  calcTco2eFromWaste,
  sumTco2e,
  computeDashboardTotals,
} from './calculations'

describe('calcTco2eFromSpend', () => {
  it('applies PROXY_FACTOR correctly for a round spend amount', () => {
    // 1000 EUR * 0.233 kgCO2e/EUR / 1000 = 0.233 tCO2e
    expect(calcTco2eFromSpend(1000)).toBeCloseTo(0.233, 5)
  })

  it('returns 0 for 0 EUR', () => {
    expect(calcTco2eFromSpend(0)).toBe(0)
  })

  it('scales linearly — 2x spend = 2x emissions', () => {
    const single = calcTco2eFromSpend(5000)
    const double = calcTco2eFromSpend(10000)
    expect(double).toBeCloseTo(single * 2, 5)
  })

  it('matches manual formula: spend_eur * PROXY_FACTOR / 1000', () => {
    const spend = 42500
    expect(calcTco2eFromSpend(spend)).toBeCloseTo((spend * PROXY_FACTOR) / 1000, 5)
  })
})

describe('calcTco2eFromTonKm', () => {
  it('calculates correctly for 1000 ton-km', () => {
    // 1000 tkm * 0.062 kgCO2e/tkm / 1000 = 0.062 tCO2e
    expect(calcTco2eFromTonKm(1000)).toBeCloseTo(0.062, 5)
  })

  it('returns 0 for 0 ton-km', () => {
    expect(calcTco2eFromTonKm(0)).toBe(0)
  })
})

describe('calcTco2eFromWaste', () => {
  it('calculates correctly for 1000 kg waste', () => {
    // 1000 kg * 0.467 kgCO2e/kg / 1000 = 0.467 tCO2e
    expect(calcTco2eFromWaste(1000)).toBeCloseTo(0.467, 5)
  })

  it('returns 0 for 0 kg', () => {
    expect(calcTco2eFromWaste(0)).toBe(0)
  })
})

describe('sumTco2e', () => {
  it('sums correctly', () => {
    expect(sumTco2e([10.5, 20.3, 5.2])).toBeCloseTo(36.0, 3)
  })

  it('returns 0 for empty array', () => {
    expect(sumTco2e([])).toBe(0)
  })

  it('rounds to 3 decimal places', () => {
    // 0.1 + 0.2 in floating point is 0.30000000000000004
    const result = sumTco2e([0.1, 0.2])
    expect(result).toBe(0.3)
  })
})

describe('computeDashboardTotals', () => {
  it('sums each scope and computes total', () => {
    const result = computeDashboardTotals([10, 20], [5, 5], [100])
    expect(result.scope1).toBe(30)
    expect(result.scope2).toBe(10)
    expect(result.scope3).toBe(100)
    expect(result.total).toBe(140)
  })

  it('handles empty arrays (no records for a scope)', () => {
    const result = computeDashboardTotals([], [], [50])
    expect(result.scope1).toBe(0)
    expect(result.scope2).toBe(0)
    expect(result.scope3).toBe(50)
    expect(result.total).toBe(50)
  })

  it('all zeros for all-empty input', () => {
    const result = computeDashboardTotals([], [], [])
    expect(result).toEqual({ scope1: 0, scope2: 0, scope3: 0, total: 0 })
  })
})
