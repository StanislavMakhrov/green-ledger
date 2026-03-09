export const DEMO_COMPANY_ID = "demo-company-001";

// PROXY_FACTOR: 0.4 kgCO₂e per EUR spent (DEFRA/Exiobase midpoint for general purchased goods)
// This is a placeholder for demo purposes. Replace with sector-specific factors in production.
// Per ADR-005: chosen value 0.4 kgCO₂e/€ is within the DEFRA/Exiobase range of 0.3–0.5.
export const PROXY_FACTOR = 0.4; // kgCO₂e/EUR

export const PROXY_FACTOR_SOURCE =
  "DEFRA/Exiobase average emission intensity for purchased goods and services (placeholder)";

// TON_KM_EMISSION_FACTOR: 0.1 kgCO₂e per tonne-kilometre (average road freight proxy)
// This is a placeholder for demo purposes. Replace with mode-specific factors in production.
export const TON_KM_EMISSION_FACTOR = 0.0001; // tCO₂e/ton-km (= 0.1 kgCO₂e/ton-km)

export const TON_KM_EMISSION_FACTOR_SOURCE =
  "DEFRA average road freight emission factor (placeholder)";

// WASTE_EMISSION_FACTOR: 1 kgCO₂e per kg of waste (average landfill/incineration proxy)
// This is a placeholder for demo purposes. Replace with waste-type-specific factors in production.
export const WASTE_EMISSION_FACTOR = 0.001; // tCO₂e/kg (= 1 kgCO₂e/kg)

export const WASTE_EMISSION_FACTOR_SOURCE =
  "DEFRA average waste treatment emission factor (placeholder)";
