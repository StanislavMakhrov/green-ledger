import { describe, it, expect } from "vitest";
import { DEMO_COMPANY_ID, PROXY_FACTOR_PER_EUR } from "../constants";

describe("constants", () => {
  it("DEMO_COMPANY_ID is defined", () => {
    expect(DEMO_COMPANY_ID).toBe("demo-company-001");
  });

  it("PROXY_FACTOR_PER_EUR is a positive number", () => {
    expect(PROXY_FACTOR_PER_EUR).toBeGreaterThan(0);
  });
});
