/** kgCO2e per EUR — placeholder spend-based proxy factor. Source: DEFRA 2023. */
export const PROXY_FACTOR = 0.45;

/** Human-readable citation for the proxy factor. */
export const PROXY_FACTOR_SOURCE =
  "DEFRA 2023 spend-based emission factors (placeholder)";

/**
 * tCO2e per ton-km — placeholder road freight emission factor.
 * Source: GLEC Framework 2023 default (road, EU average).
 */
export const TON_KM_FACTOR = 0.0002;

/**
 * tCO2e per kg waste — placeholder mixed waste emission factor.
 * Source: DEFRA 2023 waste factors (placeholder).
 */
export const WASTE_KG_FACTOR = 0.001;

/** Environment variable key used to identify the demo company. */
export const DEMO_COMPANY_ID_KEY = "DEMO_COMPANY_ID";
