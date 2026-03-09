/** DEMO company ID — used as the single tenant in the MVP */
export const DEMO_COMPANY_ID = "demo-company-001";

/**
 * PROXY EMISSION FACTORS — PLACEHOLDER VALUES (demo only)
 * These factors are illustrative and NOT suitable for real CSRD reporting.
 */

/** kgCO2e per EUR of spend (spend-based proxy, Scope 3 Category 1) */
export const PROXY_FACTOR_SPEND_KG_PER_EUR = 0.5;

/** kgCO2e per tonne-kilometre (transport proxy, Scope 3 Category 4) */
export const PROXY_FACTOR_TRANSPORT_KG_PER_TON_KM = 0.1;

/** kgCO2e per kilogram of waste (waste proxy, Scope 3 Category 5) */
export const PROXY_FACTOR_WASTE_KG_PER_KG = 2.0;

/** Confidence score assigned to all proxy-calculated records */
export const PROXY_CONFIDENCE = 0.5;

/** Human-readable source strings stored on proxy records */
export const PROXY_FACTOR_SOURCE = "DEFRA spend-based proxy 2023 – placeholder value";
export const TRANSPORT_FACTOR_SOURCE = "DEFRA road freight proxy 2023 – placeholder value";
export const WASTE_FACTOR_SOURCE = "DEFRA waste disposal proxy 2023 – placeholder value";

/** Standard assumptions text stored on proxy records */
export const PROXY_ASSUMPTIONS_SPEND =
  "Spend-based proxy applied. Actual emission intensity of supplier not known. " +
  "Factor: 0.5 kgCO2e/EUR (placeholder). Confidence: 0.5.";
export const PROXY_ASSUMPTIONS_TRANSPORT =
  "Transport proxy applied. Factor: 0.1 kgCO2e/tonne-km (placeholder). Confidence: 0.5.";
export const PROXY_ASSUMPTIONS_WASTE =
  "Waste proxy applied. Factor: 2.0 kgCO2e/kg (placeholder). Confidence: 0.5.";
