import {
  PROXY_FACTOR_SPEND_KG_PER_EUR,
  PROXY_FACTOR_TRANSPORT_KG_PER_TON_KM,
  PROXY_FACTOR_WASTE_KG_PER_KG,
  PROXY_CONFIDENCE,
  PROXY_FACTOR_SOURCE,
  TRANSPORT_FACTOR_SOURCE,
  WASTE_FACTOR_SOURCE,
  PROXY_ASSUMPTIONS_SPEND,
  PROXY_ASSUMPTIONS_TRANSPORT,
  PROXY_ASSUMPTIONS_WASTE,
} from "./constants";

export interface ActivityData {
  spend_eur?: number;
  ton_km?: number;
  waste_kg?: number;
}

export interface ProxyResult {
  valueTco2e: number;
  calculationMethod: "spend_based" | "activity_based";
  emissionFactorSource: string;
  assumptions: string;
  confidence: number;
  dataSource: "proxy";
}

/**
 * Calculate proxy emissions from activity data.
 * Priority: waste_kg > ton_km > spend_eur
 */
export function calculateProxy(activity: ActivityData): ProxyResult {
  if (activity.waste_kg !== undefined && activity.waste_kg > 0) {
    return {
      valueTco2e: (activity.waste_kg * PROXY_FACTOR_WASTE_KG_PER_KG) / 1000,
      calculationMethod: "activity_based",
      emissionFactorSource: WASTE_FACTOR_SOURCE,
      assumptions: PROXY_ASSUMPTIONS_WASTE,
      confidence: PROXY_CONFIDENCE,
      dataSource: "proxy",
    };
  }

  if (activity.ton_km !== undefined && activity.ton_km > 0) {
    return {
      valueTco2e: (activity.ton_km * PROXY_FACTOR_TRANSPORT_KG_PER_TON_KM) / 1000,
      calculationMethod: "activity_based",
      emissionFactorSource: TRANSPORT_FACTOR_SOURCE,
      assumptions: PROXY_ASSUMPTIONS_TRANSPORT,
      confidence: PROXY_CONFIDENCE,
      dataSource: "proxy",
    };
  }

  if (activity.spend_eur !== undefined && activity.spend_eur > 0) {
    return {
      valueTco2e: (activity.spend_eur * PROXY_FACTOR_SPEND_KG_PER_EUR) / 1000,
      calculationMethod: "spend_based",
      emissionFactorSource: PROXY_FACTOR_SOURCE,
      assumptions: PROXY_ASSUMPTIONS_SPEND,
      confidence: PROXY_CONFIDENCE,
      dataSource: "proxy",
    };
  }

  return {
    valueTco2e: 0,
    calculationMethod: "spend_based",
    emissionFactorSource: PROXY_FACTOR_SOURCE,
    assumptions: "No activity data provided; value set to 0.",
    confidence: 0,
    dataSource: "proxy",
  };
}

/**
 * Sum valueTco2e for records matching the given year.
 */
export function calculateScopeTotal(
  records: Array<{ valueTco2e: number; periodYear: number }>,
  year: number
): number {
  return records
    .filter((r) => r.periodYear === year)
    .reduce((sum, r) => sum + r.valueTco2e, 0);
}

/**
 * Calculate grand total from individual scope totals.
 */
export function calculateGrandTotal(
  scope1: number,
  scope2: number,
  scope3: number
): number {
  return scope1 + scope2 + scope3;
}
