import { describe, it, expect } from "vitest";
import { calculateScopeTotal, calculateGrandTotal } from "../calculations";

describe("calculateScopeTotal", () => {
  it("TC-01: with multiple records for year returns correct sum", () => {
    const records = [
      { valueTco2e: 45.2, periodYear: 2024 },
      { valueTco2e: 12.8, periodYear: 2024 },
      { valueTco2e: 30.0, periodYear: 2023 },
    ];
    expect(calculateScopeTotal(records, 2024)).toBeCloseTo(58.0);
  });

  it("TC-02: with single record returns that value", () => {
    const records = [{ valueTco2e: 38.5, periodYear: 2024 }];
    expect(calculateScopeTotal(records, 2024)).toBeCloseTo(38.5);
  });

  it("TC-04: with empty array returns 0", () => {
    expect(calculateScopeTotal([], 2024)).toBe(0);
  });
});

describe("calculateGrandTotal", () => {
  it("TC-03: returns sum of all three scopes", () => {
    expect(calculateGrandTotal(58.0, 38.5, 258.3)).toBeCloseTo(354.8);
  });
});
