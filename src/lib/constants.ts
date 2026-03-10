/** Fixed UUID of the single demo company. Seeded in prisma/seed.ts. */
export const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000001";

/**
 * Placeholder emission factor: kgCO₂e per EUR of spend.
 * Source: DEFRA spend-based proxy, generalised for demo purposes.
 * Replace with sector-specific factors in production.
 */
export const PROXY_FACTOR = 0.00042;

/** PROXY_FACTOR source description for audit trail storage. */
export const PROXY_FACTOR_SOURCE = "DEFRA spend-based emission factor (generalised, demo placeholder)";

/** Transport emission factor: kgCO₂e per ton-km */
export const TRANSPORT_FACTOR = 0.00010;

/** Transport factor source description */
export const TRANSPORT_FACTOR_SOURCE = "DEFRA freight transport emission factor (generalised, demo placeholder)";

/** Waste emission factor: kgCO₂e per kg of waste */
export const WASTE_FACTOR = 0.00050;

/** Waste factor source description */
export const WASTE_FACTOR_SOURCE = "DEFRA waste disposal emission factor (generalised, demo placeholder)";
