import { describe, it, expect } from "vitest";
import { calculateProxyTco2e, calculateDashboardTotals, calculateProxyEmissions, resolveSupplierFormEmissions } from "./emissions";
import { PROXY_FACTOR, TON_KM_EMISSION_FACTOR, WASTE_EMISSION_FACTOR } from "./constants";

describe("calculateProxyTco2e", () => {
  it("converts spend_eur to tCO2e using PROXY_FACTOR", () => {
    expect(calculateProxyTco2e(1000)).toBe((1000 * PROXY_FACTOR) / 1000);
  });

  it("returns 0 for 0 spend", () => {
    expect(calculateProxyTco2e(0)).toBe(0);
  });

  it("uses PROXY_FACTOR = 0.4 kgCO2e/EUR", () => {
    // 1000 EUR × 0.4 kgCO2e/EUR ÷ 1000 = 0.4 tCO2e
    expect(calculateProxyTco2e(1000)).toBeCloseTo(0.4, 5);
  });
});

describe("calculateDashboardTotals", () => {
  it("sums up scope records and returns totals", () => {
    const s1 = [{ valueTco2e: 100 }, { valueTco2e: 20.5 }];
    const s2 = [{ valueTco2e: 85.2 }];
    const s3 = [{ valueTco2e: 50 }, { valueTco2e: 30 }];
    const result = calculateDashboardTotals(s1, s2, s3);
    expect(result.scope1).toBeCloseTo(120.5, 5);
    expect(result.scope2).toBeCloseTo(85.2, 5);
    expect(result.scope3).toBeCloseTo(80, 5);
    expect(result.total).toBeCloseTo(285.7, 5);
  });

  it("handles empty arrays", () => {
    const result = calculateDashboardTotals([], [], []);
    expect(result.scope1).toBe(0);
    expect(result.scope2).toBe(0);
    expect(result.scope3).toBe(0);
    expect(result.total).toBe(0);
  });
});

describe("calculateProxyEmissions", () => {
  it("returns spend_based method and proxy dataSource", () => {
    const result = calculateProxyEmissions({ spend_eur: 2500 });
    expect(result.calculationMethod).toBe("spend_based");
    expect(result.dataSource).toBe("proxy");
  });

  it("calculates valueTco2e correctly", () => {
    const result = calculateProxyEmissions({ spend_eur: 5000 });
    expect(result.valueTco2e).toBeCloseTo((5000 * 0.4) / 1000, 5);
  });

  it("returns confidence 0.6 for proxy estimates", () => {
    const result = calculateProxyEmissions({ spend_eur: 1000 });
    expect(result.confidence).toBe(0.6);
  });

  it("includes assumptions string mentioning PROXY_FACTOR", () => {
    const result = calculateProxyEmissions({ spend_eur: 1000 });
    expect(result.assumptions).toContain("0.4");
  });
});

describe("resolveSupplierFormEmissions", () => {
  it("resolveSupplierFormEmissions_spendEur_returnsProxyDataSource", () => {
    const result = resolveSupplierFormEmissions({ spend_eur: 5000 });
    expect(result).not.toBeNull();
    expect(result!.dataSource).toBe("proxy");
    expect(result!.calculationMethod).toBe("spend_based");
    expect(result!.valueTco2e).toBeCloseTo((5000 * PROXY_FACTOR) / 1000, 5);
    expect(result!.confidence).toBe(0.6);
  });

  it("resolveSupplierFormEmissions_tonKm_returnsActivityBased", () => {
    const result = resolveSupplierFormEmissions({ ton_km: 1000 });
    expect(result).not.toBeNull();
    expect(result!.dataSource).toBe("supplier_form");
    expect(result!.calculationMethod).toBe("activity_based");
    expect(result!.valueTco2e).toBeCloseTo(1000 * TON_KM_EMISSION_FACTOR, 5);
    expect(result!.confidence).toBe(0.7);
  });

  it("resolveSupplierFormEmissions_wasteKg_returnsActivityBased", () => {
    const result = resolveSupplierFormEmissions({ waste_kg: 500 });
    expect(result).not.toBeNull();
    expect(result!.dataSource).toBe("supplier_form");
    expect(result!.calculationMethod).toBe("activity_based");
    expect(result!.valueTco2e).toBeCloseTo(500 * WASTE_EMISSION_FACTOR, 5);
    expect(result!.confidence).toBe(0.5);
  });

  it("resolveSupplierFormEmissions_spendEurTakesPriorityOverTonKm", () => {
    const result = resolveSupplierFormEmissions({ spend_eur: 1000, ton_km: 500 });
    expect(result).not.toBeNull();
    expect(result!.calculationMethod).toBe("spend_based");
  });

  it("resolveSupplierFormEmissions_noValidData_returnsNull", () => {
    expect(resolveSupplierFormEmissions({})).toBeNull();
    expect(resolveSupplierFormEmissions({ spend_eur: 0, ton_km: 0, waste_kg: 0 })).toBeNull();
    expect(resolveSupplierFormEmissions({ spend_eur: null })).toBeNull();
  });
});
