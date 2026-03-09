# ADR-005: PROXY_FACTOR Configuration

## Status

Accepted

## Context

FR-005 and FR-006 require a spend-based proxy emission factor (`PROXY_FACTOR`) to convert a
supplier's `spend_eur` value to tonnes of CO₂e:

```
valueTco2e = spend_eur × PROXY_FACTOR / 1000
```

(PROXY_FACTOR is in kgCO₂e/€; dividing by 1000 converts to tCO₂e.)

The spec notes this is a placeholder value for demo purposes. A common range for
purchased goods from European spend-based databases (DEFRA, Exiobase) is 0.3–0.5 kgCO₂e/€.
The factor must be:
- Defined as a **named constant** (not a magic number inline in code)
- Documented as a **placeholder** so auditors and future developers know it is approximate
- Accompanied by a **source string** that is stored on the `Scope3Record`

## Decision

- Set `PROXY_FACTOR = 0.4` kgCO₂e/€ as the named constant.
- Set `PROXY_FACTOR_SOURCE = "Exiobase v3.8 – global average, purchased goods & services (placeholder)"` as the accompanying source string constant.
- Both constants are defined in `src/lib/constants.ts`.
- The proxy calculation formula is implemented in `src/lib/emissions.ts` as a pure function:
  `calculateProxyTco2e(spendEur: number): number`.
- When a `Scope3Record` is created via proxy, `emissionFactorSource` is set to
  `PROXY_FACTOR_SOURCE` and `assumptions` records the formula and factor value.

## Rationale

**0.4 kgCO₂e/€** is the midpoint of the commonly cited 0.3–0.5 kgCO₂e/€ range for
general purchased goods & services in European supply chains (sourced from Exiobase/DEFRA
spend-based emission factor databases). It is a defensible placeholder for a demo:
it is neither implausibly low nor exaggeratedly high, and it corresponds to a real
methodological source.

**Named constant in `lib/constants.ts`**: Avoids magic numbers scattered through the codebase,
is easy to find and update, and makes the Vitest unit test for proxy calculation explicit
about what value is being tested.

**Source string stored on the record**: CSRD/ESRS requires that every emission factor source
be documented. Storing `PROXY_FACTOR_SOURCE` on each `Scope3Record.emissionFactorSource`
satisfies this requirement at the record level and ensures the PDF's Assumptions section
can display it accurately.

**Not an environment variable**: For the MVP demo, the factor does not need to be runtime-
configurable. A compile-time constant is simpler and ensures consistency. If a future version
needs per-company or per-category factors, it can be moved to a database table.

## Consequences

**Positive:**
- Consistent, traceable proxy calculations across all records.
- Easy to locate and update the factor for future releases (single constant file).
- Stored source string satisfies CSRD documentation requirements at the record level.
- Unit tests for the proxy calculation are straightforward and explicit.

**Negative:**
- The 0.4 kgCO₂e/€ value is a general placeholder and may not be accurate for specific
  industries or supplier types. Real deployments must use sector-specific factors.
- A constant cannot be changed at runtime without a redeploy. For the MVP demo this is
  acceptable; for production it would need to be a configurable setting.

## Implementation Notes

- `src/lib/constants.ts`:
  ```typescript
  /** Spend-based proxy emission factor (kgCO₂e per EUR spent).
   *  PLACEHOLDER VALUE for demo purposes only.
   *  Source: Exiobase v3.8 – global average, purchased goods & services.
   *  Replace with sector-specific factors for production use.
   */
  export const PROXY_FACTOR = 0.4; // kgCO₂e/€

  export const PROXY_FACTOR_SOURCE =
    "Exiobase v3.8 – global average, purchased goods & services (placeholder)";
  ```
- `src/lib/emissions.ts`:
  ```typescript
  import { PROXY_FACTOR } from "./constants";

  /** Convert EUR spend to tCO₂e using the spend-based proxy factor. */
  export function calculateProxyTco2e(spendEur: number): number {
    return (spendEur * PROXY_FACTOR) / 1000;
  }
  ```
- When creating a `Scope3Record` from a spend-only supplier form submission:
  - `calculationMethod = "spend_based"`
  - `emissionFactorSource = PROXY_FACTOR_SOURCE`
  - `confidence = 0.4` (reflecting proxy uncertainty; lower than activity-based or
    supplier-specific data)
  - `assumptions = \`Spend-based proxy: ${spendEur} EUR × ${PROXY_FACTOR} kgCO₂e/EUR ÷ 1000 = ${valueTco2e} tCO₂e. Factor: ${PROXY_FACTOR_SOURCE}.\``
  - `dataSource = "proxy"` (if no other data provided) or `"supplier_form"` (always, per FR-005)

  > Note: FR-005 specifies `dataSource = "supplier_form"` for all supplier form submissions.
  > The `calculationMethod = "spend_based"` field indicates the proxy was used. Records
  > should be included in the PDF Assumptions section because `confidence < 1`.
