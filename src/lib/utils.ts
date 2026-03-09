// ─────────────────────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formats a tCO₂e value to 2 decimal places as a string.
 * Used consistently across the UI and PDF export for emission values.
 *
 * @param value - The numeric tCO₂e value to format
 * @returns The value formatted to 2 decimal places (e.g. "1.23")
 *
 * @example
 * formatTco2e(1.2345) // "1.23"
 * formatTco2e(0)      // "0.00"
 */
export function formatTco2e(value: number): string {
  return value.toFixed(2);
}

/**
 * Merges Tailwind CSS class names, filtering out falsy values.
 * Lightweight alternative to clsx for combining conditional class strings.
 *
 * @param classes - Class strings, or falsy values (undefined, false, null) to skip
 * @returns Merged class string with falsy values removed
 *
 * @example
 * cn("px-4", isActive && "bg-blue-500", undefined) // "px-4 bg-blue-500"
 */
export function cn(
  ...classes: (string | undefined | false | null)[]
): string {
  return classes.filter(Boolean).join(" ");
}
