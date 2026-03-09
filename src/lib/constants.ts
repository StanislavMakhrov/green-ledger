// ─────────────────────────────────────────────────────────────────────────────
// Application Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Fixed primary key for the single demo company seeded at startup. */
export const DEMO_COMPANY_ID = "demo-company-001";

/**
 * Default reporting year used when REPORTING_YEAR env var is not set.
 * The actual value is read from Company.reportingYear in the database at runtime.
 */
export const DEFAULT_REPORTING_YEAR = 2024;

// ─────────────────────────────────────────────────────────────────────────────
// Proxy Emission Factors
// ⚠️  DEMO PLACEHOLDERS ONLY — these values are NOT authoritative.
//     Do not use for regulatory or compliance reporting.
//     Source references: DEFRA Greenhouse Gas Reporting (2023 edition)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Spend-based proxy factor.
 * Unit: tCO₂e per EUR of procurement spend.
 * Basis: DEFRA 2023 "all industry" spend-based emission factor (converted to EUR).
 * @remarks DEMO PLACEHOLDER — not an authoritative emission factor. Do not use in production.
 */
export const PROXY_FACTOR_SPEND = 0.233;

/**
 * Transport activity proxy factor.
 * Unit: tCO₂e per tonne-kilometre (road freight).
 * Basis: DEFRA 2023 HGV average emission factor.
 * @remarks DEMO PLACEHOLDER — not an authoritative emission factor. Do not use in production.
 */
export const PROXY_FACTOR_TON_KM = 0.000102;

/**
 * Waste proxy factor.
 * Unit: tCO₂e per kilogram of waste sent to landfill.
 * Basis: DEFRA 2023 waste disposal factor.
 * @remarks DEMO PLACEHOLDER — not an authoritative emission factor. Do not use in production.
 */
export const PROXY_FACTOR_WASTE_KG = 0.000467;

/**
 * Default confidence score for spend-based proxy estimates.
 * Low confidence (0.4) reflects single-factor spend proxy with no activity detail.
 */
export const PROXY_CONFIDENCE = 0.4;

/**
 * Confidence score for activity-based proxy estimates (transport/waste).
 * Slightly higher (0.5) as physical activity units provide better accuracy than spend.
 */
export const PROXY_CONFIDENCE_ACTIVITY = 0.5;

// ─────────────────────────────────────────────────────────────────────────────
// Proxy Assumption Strings (stored in Scope3Record.assumptions for audit trail)
// ─────────────────────────────────────────────────────────────────────────────

/** Builds the assumptions string for spend-based proxy records. */
export const PROXY_ASSUMPTION_SPEND = (factor: number): string =>
  `Spend-based proxy estimate using DEFRA 2023 factor: ${factor} tCO₂e/EUR. ` +
  `This is a placeholder value for demonstration purposes only.`;

/** Builds the assumptions string for transport activity-based proxy records. */
export const PROXY_ASSUMPTION_TON_KM = (factor: number): string =>
  `Activity-based transport estimate using DEFRA 2023 HGV factor: ${factor} tCO₂e/tonne-km. ` +
  `This is a placeholder value for demonstration purposes only.`;

/** Builds the assumptions string for waste activity-based proxy records. */
export const PROXY_ASSUMPTION_WASTE = (factor: number): string =>
  `Activity-based waste estimate using DEFRA 2023 landfill factor: ${factor} tCO₂e/kg. ` +
  `This is a placeholder value for demonstration purposes only.`;

// ─────────────────────────────────────────────────────────────────────────────
// ESRS Scope 3 Categories
// ─────────────────────────────────────────────────────────────────────────────

/** All 15 standard ESRS Scope 3 categories (C1–C15) with codes and names. */
export const SCOPE3_CATEGORIES = [
  { code: "C1", name: "Purchased goods & services" },
  { code: "C2", name: "Capital goods" },
  { code: "C3", name: "Fuel- and energy-related activities" },
  { code: "C4", name: "Upstream transportation & distribution" },
  { code: "C5", name: "Waste generated in operations" },
  { code: "C6", name: "Business travel" },
  { code: "C7", name: "Employee commuting" },
  { code: "C8", name: "Upstream leased assets" },
  { code: "C9", name: "Downstream transportation & distribution" },
  { code: "C10", name: "Processing of sold products" },
  { code: "C11", name: "Use of sold products" },
  { code: "C12", name: "End-of-life treatment of sold products" },
  { code: "C13", name: "Downstream leased assets" },
  { code: "C14", name: "Franchises" },
  { code: "C15", name: "Investments" },
] as const;
