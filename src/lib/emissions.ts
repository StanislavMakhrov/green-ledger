import { PROXY_FACTOR } from "./constants";

/**
 * Calculate tCO₂e from spend using the proxy emission factor.
 * Formula: tCO₂e = spend_eur × PROXY_FACTOR / 1000
 * (PROXY_FACTOR is in kgCO₂e/EUR; divide by 1000 to convert kg → tonnes)
 */
export function calculateProxyTco2e(spendEur: number): number {
  return (spendEur * PROXY_FACTOR) / 1000;
}

/**
 * Aggregate dashboard totals from emission records.
 * Returns scope1, scope2, scope3, and grand total in tCO₂e.
 */
export function calculateDashboardTotals(
  scope1Records: { valueTco2e: number }[],
  scope2Records: { valueTco2e: number }[],
  scope3Records: { valueTco2e: number }[]
): { scope1: number; scope2: number; scope3: number; total: number } {
  const scope1 = scope1Records.reduce((sum, r) => sum + r.valueTco2e, 0);
  const scope2 = scope2Records.reduce((sum, r) => sum + r.valueTco2e, 0);
  const scope3 = scope3Records.reduce((sum, r) => sum + r.valueTco2e, 0);
  return { scope1, scope2, scope3, total: scope1 + scope2 + scope3 };
}

/**
 * Calculate proxy emissions from a supplier form submission.
 * Returns valueTco2e, confidence, and assumptions string.
 */
export function calculateProxyEmissions(input: { spend_eur: number }): {
  valueTco2e: number;
  confidence: number;
  assumptions: string;
  calculationMethod: "spend_based";
  dataSource: "proxy";
} {
  const valueTco2e = calculateProxyTco2e(input.spend_eur);
  return {
    valueTco2e,
    confidence: 0.6,
    assumptions: `Proxy emission factor applied: ${input.spend_eur} EUR × ${PROXY_FACTOR} kgCO₂e/EUR ÷ 1000 = ${valueTco2e.toFixed(4)} tCO₂e`,
    calculationMethod: "spend_based",
    dataSource: "proxy",
  };
}
