import { PROXY_FACTOR, TON_KM_EMISSION_FACTOR, WASTE_EMISSION_FACTOR } from "./constants";

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

/**
 * Resolve supplier form submission to emission fields.
 * Tries spend_eur (proxy), then ton_km, then waste_kg.
 * Returns null if no valid activity data is present.
 * Eliminates mutable `let` declarations in the route handler.
 */
export function resolveSupplierFormEmissions(input: {
  spend_eur?: number | null;
  ton_km?: number | null;
  waste_kg?: number | null;
}): {
  valueTco2e: number;
  calculationMethod: "spend_based" | "activity_based";
  assumptions: string;
  confidence: number;
  dataSource: "supplier_form" | "proxy";
} | null {
  const spendEur = input.spend_eur != null ? Number(input.spend_eur) : 0;
  const tonKm = input.ton_km != null ? Number(input.ton_km) : 0;
  const wasteKg = input.waste_kg != null ? Number(input.waste_kg) : 0;

  if (spendEur > 0) {
    return calculateProxyEmissions({ spend_eur: spendEur });
  }
  if (tonKm > 0) {
    return {
      valueTco2e: tonKm * TON_KM_EMISSION_FACTOR,
      calculationMethod: "activity_based",
      assumptions: `Transport activity data: ${tonKm} ton-km at ${TON_KM_EMISSION_FACTOR * 1000} kgCO₂e/ton-km`,
      confidence: 0.7,
      dataSource: "supplier_form",
    };
  }
  if (wasteKg > 0) {
    return {
      valueTco2e: wasteKg * WASTE_EMISSION_FACTOR,
      calculationMethod: "activity_based",
      assumptions: `Waste data: ${wasteKg} kg at ${WASTE_EMISSION_FACTOR * 1000} kgCO₂e/kg`,
      confidence: 0.5,
      dataSource: "supplier_form",
    };
  }
  return null;
}
