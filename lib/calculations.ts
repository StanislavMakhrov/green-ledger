/**
 * Business-logic calculations for GreenLedger.
 *
 * All pure functions; no database access. Designed to be unit-tested
 * with Vitest without any Next.js or Prisma dependencies.
 *
 * Related spec: docs/spec.md §"Business Rules"
 */

/**
 * Spend-based proxy emission factor (kgCO₂e per EUR of spend).
 *
 * ⚠️  PLACEHOLDER — This is a rough cross-sector average derived from
 * publicly available spend-based emission factor databases (e.g. EXIOBASE).
 * Replace with sector-specific factors before production use.
 *
 * Source: approximate average of EXIOBASE 3.8 European manufacturing sectors.
 * Unit: tCO₂e / 1 000 EUR spent (i.e. 0.233 kgCO₂e / EUR).
 */
export const PROXY_FACTOR = 0.233 // kgCO₂e per EUR (0.233 tCO₂e per 1000 EUR spent) — see comment above

/**
 * Transport proxy emission factor (kgCO₂e per tonne-kilometre).
 *
 * ⚠️  PLACEHOLDER — Average European road freight factor.
 * Source: EcoTransIT World 2023, truck >20t, average load.
 */
export const TRANSPORT_FACTOR_KG_PER_TKM = 0.062 // kgCO₂e / tkm

/**
 * Waste proxy emission factor (kgCO₂e per kg of waste).
 *
 * ⚠️  PLACEHOLDER — Mixed waste, average EU disposal.
 * Source: DEFRA UK 2024, mixed commercial waste.
 */
export const WASTE_FACTOR_KG_PER_KG = 0.467 // kgCO₂e / kg

/** Confidence score assigned to proxy-calculated records. */
export const PROXY_CONFIDENCE = 0.4

/** Confidence score for supplier-submitted activity data. */
export const SUPPLIER_FORM_CONFIDENCE = 0.85

/**
 * Calculates tCO₂e from spend (EUR) using the spend-based proxy factor.
 *
 * Formula: tCO₂e = spend_eur * PROXY_FACTOR / 1000
 * (PROXY_FACTOR is in kgCO₂e/EUR, we divide by 1000 to convert to tCO₂e)
 *
 * @param spendEur - Spend amount in EUR
 * @returns tCO₂e value
 */
export function calcTco2eFromSpend(spendEur: number): number {
  return (spendEur * PROXY_FACTOR) / 1000
}

/**
 * Calculates tCO₂e from transport activity (tonne-kilometres).
 *
 * @param tonKm - Freight transport activity in tonne-kilometres
 * @returns tCO₂e value
 */
export function calcTco2eFromTonKm(tonKm: number): number {
  return (tonKm * TRANSPORT_FACTOR_KG_PER_TKM) / 1000
}

/**
 * Calculates tCO₂e from waste quantity (kg).
 *
 * @param wasteKg - Waste weight in kilograms
 * @returns tCO₂e value
 */
export function calcTco2eFromWaste(wasteKg: number): number {
  return (wasteKg * WASTE_FACTOR_KG_PER_KG) / 1000
}

/**
 * Sums an array of tCO₂e values, rounding to 3 decimal places.
 *
 * @param values - Array of individual tCO₂e values
 * @returns Sum rounded to 3 decimal places
 */
export function sumTco2e(values: number[]): number {
  const raw = values.reduce((acc, v) => acc + v, 0)
  return Math.round(raw * 1000) / 1000
}

/**
 * Dashboard totals shape returned by `computeDashboardTotals`.
 */
export interface DashboardTotals {
  scope1: number
  scope2: number
  scope3: number
  total: number
}

/**
 * Computes the dashboard KPI totals from flat arrays of tCO₂e values.
 *
 * All inputs are for a single reporting year — the caller is responsible
 * for filtering by `reportingYear` before passing values here.
 *
 * @param scope1Values - All Scope 1 tCO₂e values for the reporting year
 * @param scope2Values - All Scope 2 tCO₂e values for the reporting year
 * @param scope3Values - All Scope 3 tCO₂e values for the reporting year
 * @returns Totals for each scope and the grand total
 */
export function computeDashboardTotals(
  scope1Values: number[],
  scope2Values: number[],
  scope3Values: number[],
): DashboardTotals {
  const scope1 = sumTco2e(scope1Values)
  const scope2 = sumTco2e(scope2Values)
  const scope3 = sumTco2e(scope3Values)
  const total = Math.round((scope1 + scope2 + scope3) * 1000) / 1000
  return { scope1, scope2, scope3, total }
}
