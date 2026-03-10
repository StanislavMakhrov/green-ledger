import {
  PROXY_FACTOR,
  PROXY_FACTOR_SOURCE,
  TRANSPORT_FACTOR,
  TRANSPORT_FACTOR_SOURCE,
  WASTE_FACTOR,
  WASTE_FACTOR_SOURCE,
} from "@/lib/constants";

export interface ActivityInput {
  spend_eur?: number;
  ton_km?: number;
  waste_kg?: number;
}

export interface EmissionCalculationResult {
  valueTco2e: number;
  calculationMethod: "spend_based" | "activity_based";
  assumptions: string;
  confidence: number;
  emissionFactorSource: string;
}

/**
 * Calculate proxy emissions from activity data.
 * Priority: spend_eur > ton_km > waste_kg.
 * Throws if no valid activity data is provided.
 */
export function calculateProxyEmissions(input: ActivityInput): EmissionCalculationResult {
  if (input.spend_eur !== undefined && input.spend_eur > 0) {
    const valueTco2e = (input.spend_eur * PROXY_FACTOR) / 1000; // kg to tonnes
    return {
      valueTco2e,
      calculationMethod: "spend_based",
      assumptions: `Spend-based proxy: ${input.spend_eur} EUR × ${PROXY_FACTOR} kgCO₂e/EUR ÷ 1000 = ${valueTco2e.toFixed(4)} tCO₂e`,
      confidence: 0.5,
      emissionFactorSource: PROXY_FACTOR_SOURCE,
    };
  }
  if (input.ton_km !== undefined && input.ton_km > 0) {
    const valueTco2e = (input.ton_km * TRANSPORT_FACTOR) / 1000;
    return {
      valueTco2e,
      calculationMethod: "activity_based",
      assumptions: `Transport proxy: ${input.ton_km} ton-km × ${TRANSPORT_FACTOR} kgCO₂e/ton-km ÷ 1000 = ${valueTco2e.toFixed(4)} tCO₂e`,
      confidence: 0.6,
      emissionFactorSource: TRANSPORT_FACTOR_SOURCE,
    };
  }
  if (input.waste_kg !== undefined && input.waste_kg > 0) {
    const valueTco2e = (input.waste_kg * WASTE_FACTOR) / 1000;
    return {
      valueTco2e,
      calculationMethod: "activity_based",
      assumptions: `Waste proxy: ${input.waste_kg} kg × ${WASTE_FACTOR} kgCO₂e/kg ÷ 1000 = ${valueTco2e.toFixed(4)} tCO₂e`,
      confidence: 0.4,
      emissionFactorSource: WASTE_FACTOR_SOURCE,
    };
  }
  throw new Error("No valid activity data provided");
}
