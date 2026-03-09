import { describe, it, expect } from "vitest";
import { calculateProxy } from "../calculations";
import {
  PROXY_FACTOR_SOURCE,
  PROXY_CONFIDENCE,
} from "../constants";

describe("calculateProxy", () => {
  it("TC-21: with spend_eur returns correct tCO2e and metadata", () => {
    const result = calculateProxy({ spend_eur: 1000 });
    expect(result.valueTco2e).toBeCloseTo(0.5);
    expect(result.calculationMethod).toBe("spend_based");
    expect(result.dataSource).toBe("proxy");
    expect(result.emissionFactorSource).toBeTruthy();
    expect(result.emissionFactorSource.length).toBeGreaterThan(0);
    expect(result.assumptions).toBeTruthy();
    expect(result.assumptions.length).toBeGreaterThan(0);
  });

  it("TC-22: with ton_km returns correct tCO2e and metadata", () => {
    const result = calculateProxy({ ton_km: 500 });
    expect(result.valueTco2e).toBeCloseTo(0.05);
    expect(result.calculationMethod).toBe("activity_based");
    expect(result.dataSource).toBe("proxy");
  });

  it("TC-23: with waste_kg returns correct tCO2e and metadata", () => {
    const result = calculateProxy({ waste_kg: 200 });
    expect(result.valueTco2e).toBeCloseTo(0.4);
    expect(result.calculationMethod).toBe("activity_based");
    expect(result.dataSource).toBe("proxy");
  });

  it("TC-24: with multiple fields uses waste_kg priority over ton_km and spend_eur", () => {
    const result1 = calculateProxy({ spend_eur: 1000, ton_km: 500, waste_kg: 200 });
    expect(result1.valueTco2e).toBeCloseTo(0.4);

    const result2 = calculateProxy({ spend_eur: 1000, ton_km: 500 });
    expect(result2.valueTco2e).toBeCloseTo(0.05);
  });

  it("TC-25: always sets confidence to PROXY_CONFIDENCE (0.5)", () => {
    expect(calculateProxy({ spend_eur: 100 }).confidence).toBe(PROXY_CONFIDENCE);
    expect(calculateProxy({ ton_km: 100 }).confidence).toBe(PROXY_CONFIDENCE);
    expect(calculateProxy({ waste_kg: 100 }).confidence).toBe(PROXY_CONFIDENCE);
  });

  it("TC-26: with spend_eur sets non-empty assumptions with factor info", () => {
    const result = calculateProxy({ spend_eur: 100 });
    expect(result.assumptions.length).toBeGreaterThan(0);
    expect(result.assumptions).toMatch(/0\.5|kgCO2e/);
  });
});
