import { describe, it, expect } from "vitest";
import {
  calculateProxyTco2e,
  buildProxyAssumptions,
  buildActivityDataJson,
  getProxyConfidence,
  calculateProxyEmissions,
} from "@/lib/proxy";
import {
  PROXY_FACTOR_SPEND,
  PROXY_FACTOR_TON_KM,
  PROXY_FACTOR_WASTE_KG,
  PROXY_CONFIDENCE,
  PROXY_CONFIDENCE_ACTIVITY,
} from "@/lib/constants";

// ─────────────────────────────────────────────────────────────────────────────
// TC-25, TC-26: Proxy calculation — spend_eur
// ─────────────────────────────────────────────────────────────────────────────

describe("calculateProxyTco2e", () => {
  it("TC-25: returns spend_eur × PROXY_FACTOR_SPEND", () => {
    const result = calculateProxyTco2e({ spend_eur: 1000 });
    expect(result).toBe(1000 * PROXY_FACTOR_SPEND);
    expect(result).toBe(233);
  });

  it("TC-26: returns 0 when spend_eur is 0", () => {
    const result = calculateProxyTco2e({ spend_eur: 0 });
    expect(result).toBe(0);
  });

  // TC-29: ton_km proxy
  it("TC-29: returns ton_km × PROXY_FACTOR_TON_KM", () => {
    const result = calculateProxyTco2e({ ton_km: 50000 });
    expect(result).toBeCloseTo(50000 * PROXY_FACTOR_TON_KM);
    expect(result).toBeCloseTo(5.1);
  });

  // TC-30: waste_kg proxy
  it("TC-30: returns waste_kg × PROXY_FACTOR_WASTE_KG", () => {
    const result = calculateProxyTco2e({ waste_kg: 1000 });
    expect(result).toBeCloseTo(1000 * PROXY_FACTOR_WASTE_KG);
  });

  it("returns 0 when all inputs are undefined", () => {
    const result = calculateProxyTco2e({});
    expect(result).toBe(0);
  });

  it("prioritises spend_eur over ton_km and waste_kg", () => {
    const result = calculateProxyTco2e({
      spend_eur: 1000,
      ton_km: 50000,
      waste_kg: 100,
    });
    expect(result).toBe(1000 * PROXY_FACTOR_SPEND);
  });

  it("uses ton_km when spend_eur is not provided", () => {
    const result = calculateProxyTco2e({ ton_km: 100, waste_kg: 50 });
    expect(result).toBeCloseTo(100 * PROXY_FACTOR_TON_KM);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-27: Proxy assumptions string
// ─────────────────────────────────────────────────────────────────────────────

describe("buildProxyAssumptions", () => {
  it("TC-27: contains 0.233 when spend_eur is used", () => {
    const result = buildProxyAssumptions({ spend_eur: 1000 });
    expect(result).toContain("0.233");
    expect(result).toContain("DEFRA");
    expect(result).toContain("placeholder");
  });

  it("contains ton-km factor when ton_km is used", () => {
    const result = buildProxyAssumptions({ ton_km: 1000 });
    expect(result).toContain(String(PROXY_FACTOR_TON_KM));
    expect(result).toContain("tonne-km");
    expect(result).toContain("placeholder");
  });

  it("contains waste factor when waste_kg is used", () => {
    const result = buildProxyAssumptions({ waste_kg: 1000 });
    expect(result).toContain(String(PROXY_FACTOR_WASTE_KG));
    expect(result).toContain("kg");
    expect(result).toContain("placeholder");
  });

  it("returns fallback when no input provided", () => {
    const result = buildProxyAssumptions({});
    expect(result).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-28: Proxy confidence values
// ─────────────────────────────────────────────────────────────────────────────

describe("getProxyConfidence", () => {
  it("TC-28: returns PROXY_CONFIDENCE (0.4) for spend-based estimates", () => {
    const result = getProxyConfidence({ spend_eur: 1000 });
    expect(result).toBe(PROXY_CONFIDENCE);
    expect(result).toBe(0.4);
  });

  it("TC-28b: returns PROXY_CONFIDENCE_ACTIVITY (0.5) for ton_km estimates", () => {
    const result = getProxyConfidence({ ton_km: 1000 });
    expect(result).toBe(PROXY_CONFIDENCE_ACTIVITY);
    expect(result).toBe(0.5);
  });

  it("returns 0.5 for waste_kg estimates", () => {
    const result = getProxyConfidence({ waste_kg: 100 });
    expect(result).toBe(PROXY_CONFIDENCE_ACTIVITY);
  });

  it("spend_eur takes priority when multiple inputs provided", () => {
    const result = getProxyConfidence({ spend_eur: 100, ton_km: 50 });
    expect(result).toBe(PROXY_CONFIDENCE);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildActivityDataJson
// ─────────────────────────────────────────────────────────────────────────────

describe("buildActivityDataJson", () => {
  it("includes only spend_eur when only spend provided", () => {
    const result = buildActivityDataJson({ spend_eur: 1000 });
    expect(result).toEqual({ spend_eur: 1000 });
    expect(result.ton_km).toBeUndefined();
    expect(result.waste_kg).toBeUndefined();
  });

  it("includes all provided fields", () => {
    const result = buildActivityDataJson({
      spend_eur: 1000,
      ton_km: 500,
      waste_kg: 100,
    });
    expect(result).toEqual({ spend_eur: 1000, ton_km: 500, waste_kg: 100 });
  });

  it("returns empty object when no inputs provided", () => {
    const result = buildActivityDataJson({});
    expect(result).toEqual({});
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calculateProxyEmissions (full result)
// ─────────────────────────────────────────────────────────────────────────────

describe("calculateProxyEmissions", () => {
  it("returns complete result for spend_eur input", () => {
    const result = calculateProxyEmissions({ spend_eur: 1000 });
    expect(result.valueTco2e).toBe(233);
    expect(result.calculationMethod).toBe("spend_based");
    expect(result.assumptions).toContain("0.233");
    expect(result.confidence).toBe(0.4);
  });

  it("returns complete result for ton_km input", () => {
    const result = calculateProxyEmissions({ ton_km: 50000 });
    expect(result.valueTco2e).toBeCloseTo(5.1);
    expect(result.calculationMethod).toBe("activity_based");
    expect(result.confidence).toBe(0.5);
  });
});
