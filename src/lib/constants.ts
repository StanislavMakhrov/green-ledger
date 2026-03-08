/** The single demo company used throughout the application */
export const DEMO_COMPANY_ID = "demo-company-001";

/**
 * Proxy emission factor: spend_eur * PROXY_FACTOR = tCO2e
 * Source: DEFRA / EEIO spend-based average
 */
export const PROXY_FACTOR = 0.233;

/**
 * Activity-based emission factors
 * ton_km → tCO2e (road freight average)
 */
export const TON_KM_FACTOR = 0.062;

/**
 * waste_kg → tCO2e (mixed waste average)
 */
export const WASTE_KG_FACTOR = 0.467;

/** Confidence score assigned when supplier submits spend-based data */
export const CONFIDENCE_SPEND = 0.5;

/** Confidence score assigned when supplier submits activity-based ton_km */
export const CONFIDENCE_TON_KM = 0.7;

/** Confidence score assigned when supplier submits activity-based waste_kg */
export const CONFIDENCE_WASTE_KG = 0.6;

/** Default Scope 3 category code for supplier-submitted data */
export const DEFAULT_SUPPLIER_CATEGORY_CODE = "C1";
