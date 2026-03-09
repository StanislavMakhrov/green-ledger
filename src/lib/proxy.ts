import {
  PROXY_FACTOR_SPEND,
  PROXY_FACTOR_TON_KM,
  PROXY_FACTOR_WASTE_KG,
  PROXY_CONFIDENCE,
  PROXY_CONFIDENCE_ACTIVITY,
  PROXY_ASSUMPTION_SPEND,
  PROXY_ASSUMPTION_TON_KM,
  PROXY_ASSUMPTION_WASTE,
} from "./constants";

// ─────────────────────────────────────────────────────────────────────────────
// Proxy Calculation Pure Functions
// ─────────────────────────────────────────────────────────────────────────────
// All functions here are pure (no side effects, no Prisma calls)
// to enable unit testing without any mocking.

/** Input data submitted by a supplier via the public form. */
export interface ProxyInput {
  spend_eur?: number;
  ton_km?: number;
  waste_kg?: number;
}

/** Result of a proxy emission calculation. */
export interface ProxyResult {
  valueTco2e: number;
  calculationMethod: string;
  assumptions: string;
  confidence: number;
}

/**
 * Calculates tCO₂e from activity data using proxy emission factors.
 * Priority order: spend_eur → ton_km → waste_kg.
 * Returns 0 if all inputs are undefined or zero.
 *
 * @param input - Activity data with optional spend_eur, ton_km, and waste_kg
 * @returns tCO₂e value computed using the appropriate proxy factor
 */
export function calculateProxyTco2e(input: ProxyInput): number {
  if (input.spend_eur !== undefined) {
    return input.spend_eur * PROXY_FACTOR_SPEND;
  }
  if (input.ton_km !== undefined) {
    return input.ton_km * PROXY_FACTOR_TON_KM;
  }
  if (input.waste_kg !== undefined) {
    return input.waste_kg * PROXY_FACTOR_WASTE_KG;
  }
  return 0;
}

/**
 * Returns the confidence score appropriate for the type of proxy input provided.
 * Spend-based estimates have lower confidence (0.4) than activity-based (0.5).
 *
 * @param input - Activity data submitted by supplier
 * @returns Confidence score (0–1)
 */
export function getProxyConfidence(input: ProxyInput): number {
  if (input.spend_eur !== undefined) {
    return PROXY_CONFIDENCE;
  }
  return PROXY_CONFIDENCE_ACTIVITY;
}

/**
 * Builds a human-readable assumptions string documenting the proxy factor used.
 * This string is stored in Scope3Record.assumptions for auditor visibility.
 *
 * @param input - Activity data submitted by supplier
 * @returns Assumptions string referencing the proxy factor value and its limitations
 */
export function buildProxyAssumptions(input: ProxyInput): string {
  if (input.spend_eur !== undefined) {
    return PROXY_ASSUMPTION_SPEND(PROXY_FACTOR_SPEND);
  }
  if (input.ton_km !== undefined) {
    return PROXY_ASSUMPTION_TON_KM(PROXY_FACTOR_TON_KM);
  }
  if (input.waste_kg !== undefined) {
    return PROXY_ASSUMPTION_WASTE(PROXY_FACTOR_WASTE_KG);
  }
  return "No activity data provided.";
}

/**
 * Returns the calculation method string for the given proxy input type.
 *
 * @param input - Activity data submitted by supplier
 * @returns Prisma enum value for calculationMethod
 */
export function getProxyCalculationMethod(input: ProxyInput): string {
  if (input.spend_eur !== undefined) {
    return "spend_based";
  }
  return "activity_based";
}

/**
 * Builds the activityDataJson object containing only the non-undefined input fields.
 * Stored in Scope3Record.activityDataJson for traceability.
 *
 * @param input - Activity data submitted by supplier
 * @returns Object with only the provided numeric fields
 */
export function buildActivityDataJson(
  input: ProxyInput
): Record<string, number> {
  const result: Record<string, number> = {};
  if (input.spend_eur !== undefined) result.spend_eur = input.spend_eur;
  if (input.ton_km !== undefined) result.ton_km = input.ton_km;
  if (input.waste_kg !== undefined) result.waste_kg = input.waste_kg;
  return result;
}

/**
 * Full proxy calculation that returns all fields needed to create a Scope3Record.
 * Convenience wrapper combining calculateProxyTco2e, buildProxyAssumptions, etc.
 *
 * @param input - Activity data submitted by supplier
 * @returns Complete proxy result with valueTco2e, method, assumptions, and confidence
 */
export function calculateProxyEmissions(input: ProxyInput): ProxyResult {
  return {
    valueTco2e: calculateProxyTco2e(input),
    calculationMethod: getProxyCalculationMethod(input),
    assumptions: buildProxyAssumptions(input),
    confidence: getProxyConfidence(input),
  };
}
