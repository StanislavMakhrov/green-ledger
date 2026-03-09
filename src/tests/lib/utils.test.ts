import { describe, it, expect } from "vitest";
import { formatTco2e, cn } from "@/lib/utils";
import {
  PROXY_FACTOR_SPEND,
  PROXY_FACTOR_TON_KM,
  PROXY_FACTOR_WASTE_KG,
  PROXY_CONFIDENCE,
  DEMO_COMPANY_ID,
} from "@/lib/constants";

// ─────────────────────────────────────────────────────────────────────────────
// TC-44: formatTco2e utility
// ─────────────────────────────────────────────────────────────────────────────

describe("formatTco2e", () => {
  it("TC-44: formats 1.2345 to '1.23'", () => {
    expect(formatTco2e(1.2345)).toBe("1.23");
  });

  it("formats 0 to '0.00'", () => {
    expect(formatTco2e(0)).toBe("0.00");
  });

  it("formats integer to 2 decimal places", () => {
    expect(formatTco2e(45)).toBe("45.00");
  });

  it("formats large numbers correctly", () => {
    expect(formatTco2e(1234.567)).toBe("1234.57");
  });

  it("formats negative values", () => {
    expect(formatTco2e(-5.5)).toBe("-5.50");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// cn utility
// ─────────────────────────────────────────────────────────────────────────────

describe("cn", () => {
  it("merges class strings", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("filters out falsy values", () => {
    expect(cn("px-4", false, undefined, null, "py-2")).toBe("px-4 py-2");
  });

  it("returns empty string for all falsy values", () => {
    expect(cn(false, undefined, null)).toBe("");
  });

  it("handles single class", () => {
    expect(cn("bg-green-500")).toBe("bg-green-500");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-45: PROXY_FACTOR constants correct values
// ─────────────────────────────────────────────────────────────────────────────

describe("constants", () => {
  it("TC-45: PROXY_FACTOR_SPEND is 0.233", () => {
    expect(PROXY_FACTOR_SPEND).toBe(0.233);
  });

  it("PROXY_FACTOR_TON_KM is a positive number", () => {
    expect(PROXY_FACTOR_TON_KM).toBeGreaterThan(0);
    expect(PROXY_FACTOR_TON_KM).toBe(0.000102);
  });

  it("PROXY_FACTOR_WASTE_KG is a positive number", () => {
    expect(PROXY_FACTOR_WASTE_KG).toBeGreaterThan(0);
    expect(PROXY_FACTOR_WASTE_KG).toBe(0.000467);
  });

  it("PROXY_CONFIDENCE is 0.4", () => {
    expect(PROXY_CONFIDENCE).toBe(0.4);
  });

  it("DEMO_COMPANY_ID is the expected constant", () => {
    expect(DEMO_COMPANY_ID).toBe("demo-company-001");
  });
});
