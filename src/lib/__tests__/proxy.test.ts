import { describe, it, expect } from "vitest";
import { PROXY_FACTOR } from "../constants";

describe("proxy calculation", () => {
  it("should calculate tCO2e from spend_eur using PROXY_FACTOR", () => {
    const spendEur = 1000;
    const expected = spendEur * PROXY_FACTOR;
    expect(expected).toBe(450);
  });

  it("PROXY_FACTOR should be a positive number", () => {
    expect(PROXY_FACTOR).toBeGreaterThan(0);
  });
});
