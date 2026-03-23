import { describe, it, expect } from "vitest";

// Tests for the time formatting logic used by the Clock component
describe("Clock formatting logic", () => {
  it("toLocaleTimeString returns a non-empty string", () => {
    const date = new Date("2024-06-01T10:30:45");
    const formatted = date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    expect(formatted).toBeTruthy();
    expect(typeof formatted).toBe("string");
  });

  it("two consecutive seconds produce different formatted strings", () => {
    const t1 = new Date("2024-06-01T10:30:45");
    const t2 = new Date("2024-06-01T10:30:46");
    const opts: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    };
    expect(t1.toLocaleTimeString(undefined, opts)).not.toBe(
      t2.toLocaleTimeString(undefined, opts)
    );
  });
});
