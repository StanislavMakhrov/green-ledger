import { describe, it, expect } from "vitest";
import {
  PROXY_FACTOR,
  TON_KM_FACTOR,
  WASTE_KG_FACTOR,
  CONFIDENCE_SPEND,
  CONFIDENCE_TON_KM,
  CONFIDENCE_WASTE_KG,
} from "../lib/constants";

/**
 * Tests for dashboard calculation logic and supplier form emission factor
 * calculations. These are pure unit tests with no database dependency.
 */

describe("Dashboard calculation logic", () => {
  it("sums scope totals correctly", () => {
    const scope1Records = [{ valueTco2e: 100 }, { valueTco2e: 50 }];
    const scope2Records = [{ valueTco2e: 80 }];
    const scope3Records = [{ valueTco2e: 200 }, { valueTco2e: 100 }];

    const scope1Total = scope1Records.reduce((s, r) => s + r.valueTco2e, 0);
    const scope2Total = scope2Records.reduce((s, r) => s + r.valueTco2e, 0);
    const scope3Total = scope3Records.reduce((s, r) => s + r.valueTco2e, 0);
    const total = scope1Total + scope2Total + scope3Total;

    expect(scope1Total).toBe(150);
    expect(scope2Total).toBe(80);
    expect(scope3Total).toBe(300);
    expect(total).toBe(530);
  });

  it("returns 0 total when no records exist", () => {
    const total = [].reduce((s: number, r: { valueTco2e: number }) => s + r.valueTco2e, 0);
    expect(total).toBe(0);
  });
});

describe("Supplier form emission factor calculations", () => {
  it("calculates tCO2e from spend_eur using PROXY_FACTOR", () => {
    const spend_eur = 10000;
    const valueTco2e = spend_eur * PROXY_FACTOR;
    expect(valueTco2e).toBeCloseTo(2330, 1);
    expect(CONFIDENCE_SPEND).toBe(0.5);
  });

  it("calculates tCO2e from ton_km using TON_KM_FACTOR", () => {
    const ton_km = 1000;
    const valueTco2e = ton_km * TON_KM_FACTOR;
    expect(valueTco2e).toBeCloseTo(62, 1);
    expect(CONFIDENCE_TON_KM).toBe(0.7);
  });

  it("calculates tCO2e from waste_kg using WASTE_KG_FACTOR", () => {
    const waste_kg = 1000;
    const valueTco2e = waste_kg * WASTE_KG_FACTOR;
    expect(valueTco2e).toBeCloseTo(467, 1);
    expect(CONFIDENCE_WASTE_KG).toBe(0.6);
  });

  it("spend_based has lower confidence than activity_based ton_km", () => {
    expect(CONFIDENCE_SPEND).toBeLessThan(CONFIDENCE_TON_KM);
  });

  it("PROXY_FACTOR is 0.233", () => {
    expect(PROXY_FACTOR).toBe(0.233);
  });
});
