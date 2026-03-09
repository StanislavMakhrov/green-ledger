import { describe, it, expect } from "vitest";
import { generatePublicFormToken } from "../token";

describe("generatePublicFormToken", () => {
  it("TC-11: returns a non-empty string", () => {
    const token = generatePublicFormToken();
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
  });

  it("TC-12: called twice returns different tokens", () => {
    const t1 = generatePublicFormToken();
    const t2 = generatePublicFormToken();
    expect(t1).not.toBe(t2);
  });
});
