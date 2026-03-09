# ADR-003: Proxy Factor Configuration Approach

## Status

Accepted

## Context

The supplier public form allows a supplier to submit `spend_eur` as an alternative to a
direct tCO₂e value. When only spend is provided, the system computes an estimated tCO₂e using
a spend-based emission factor ("proxy factor"):

```
tCO₂e = spend_eur × PROXY_FACTOR
```

Similarly, `ton_km` (transport activity) and `waste_kg` (waste activity) each require a
corresponding proxy factor for estimation.

The Feature Specification states:

> "Keep `PROXY_FACTOR` as a config constant for demo (document it as placeholder)"
> "The proxy factor is a hardcoded demo constant, explicitly documented as a placeholder"

Constraints:
- Values are for demonstration only — not authoritative regulatory figures
- Must be easy to locate and update (documented as placeholders)
- Must be clearly labelled in the codebase to prevent accidental use in production
- Should feed into the `assumptions` string stored on each `Scope3Record` so auditors can
  see the methodology

## Options Considered

### Option 1: Environment Variables (`.env`)

Store proxy factors as `PROXY_FACTOR_SPEND`, `PROXY_FACTOR_TON_KM`, `PROXY_FACTOR_WASTE_KG`
in `.env` and read via `process.env`.

**Pros:**
- Overridable at runtime without code changes
- Follows 12-factor app conventions

**Cons:**
- For a demo app these values are intentionally hardcoded placeholders — env var flexibility
  creates a false impression that they can be safely changed to "real" values
- Environment variable parsing (string → float) adds boilerplate and potential runtime errors
- Values are scattered and invisible in code review without inspecting `.env` files
- Does not improve the demo experience in any meaningful way

### Option 2: Constants File (`src/lib/constants.ts`)

Define all proxy factors as typed, named constants in a shared TypeScript module:

```typescript
/** DEMO ONLY — not authoritative for regulatory reporting */
export const PROXY_FACTOR_SPEND   = 0.233   // tCO₂e per EUR (DEFRA spend-based placeholder)
export const PROXY_FACTOR_TON_KM  = 0.000102 // tCO₂e per tonne-km (road freight DEFRA placeholder)
export const PROXY_FACTOR_WASTE_KG = 0.000467 // tCO₂e per kg (landfill DEFRA placeholder)
```

**Pros:**
- Single source of truth — all proxy factors in one file with clear JSDoc warnings
- Fully type-safe (TypeScript `number` literals)
- Easy to find in code review and for the Developer implementing the supplier form handler
- Values appear in `git blame` history with the ADR reference
- Constants file also holds `DEMO_COMPANY_ID` and other app-wide constants (DRY)

**Cons:**
- Requires a code change (and redeployment) to update values — acceptable for a demo app
- Cannot be changed at runtime via environment variables

### Option 3: Database Table (`ProxyFactor` model)

Persist proxy factors in a dedicated Prisma model, editable via the admin UI.

**Pros:**
- Runtime-configurable without redeployment

**Cons:**
- Significant over-engineering for a demo; the spec explicitly calls these "hardcoded demo
  constants"
- Requires additional UI, API routes, and schema changes
- Increases seed complexity and migration maintenance burden

## Decision

**Use a constants file (`src/lib/constants.ts`) — Option 2.**

## Rationale

The spec is unambiguous: proxy factors are demo placeholders, not production-grade values.
A constants file is the simplest approach that is:
- Type-safe
- Visible in code review
- Centralised alongside other app-wide constants (`DEMO_COMPANY_ID`, `REPORTING_YEAR`)
- Easy for a Developer to locate and update if the values need to be tweaked

The JSDoc warning in the constants file makes the placeholder nature explicit without relying
on documentation that may not be read.

## Consequences

### Positive
- Zero runtime configuration complexity
- All constants are co-located — a Developer implementing the supplier form handler imports
  a single module
- The `assumptions` string stored on each `Scope3Record` can be constructed directly from the
  constant's value and label, ensuring the audit trail documents the factor used

### Negative
- Changing proxy factor values requires a code change and redeployment
- Acceptable trade-off for a demo application; noted as a future improvement if the app
  evolves toward production use

## Implementation Notes

For the Developer agent:

**File:** `src/lib/constants.ts`

```typescript
// ─────────────────────────────────────────────────────────────────────────────
// Demo Application Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Fixed primary key for the single demo company seeded at startup. */
export const DEMO_COMPANY_ID = "demo-company-001"

/**
 * Reporting year used for dashboard totals and PDF export.
 * Set via REPORTING_YEAR env var at seed time; read from Company.reportingYear at runtime.
 */
export const DEFAULT_REPORTING_YEAR = 2024

// ─────────────────────────────────────────────────────────────────────────────
// Proxy Emission Factors
// ⚠️  DEMO PLACEHOLDERS ONLY — these values are NOT authoritative.
//     Do not use for regulatory or compliance reporting.
//     Source references: DEFRA Greenhouse Gas Reporting (2023 edition)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Spend-based proxy factor.
 * Unit: tCO₂e per EUR of procurement spend.
 * Basis: DEFRA 2023 "all industry" spend-based emission factor (converted to EUR).
 * ⚠️  DEMO VALUE — not suitable for regulatory reporting.
 */
export const PROXY_FACTOR_SPEND = 0.233

/**
 * Transport activity proxy factor.
 * Unit: tCO₂e per tonne-kilometre (road freight).
 * Basis: DEFRA 2023 HGV average emission factor.
 * ⚠️  DEMO VALUE — not suitable for regulatory reporting.
 */
export const PROXY_FACTOR_TON_KM = 0.000102

/**
 * Waste proxy factor.
 * Unit: tCO₂e per kilogram of waste sent to landfill.
 * Basis: DEFRA 2023 waste disposal factor.
 * ⚠️  DEMO VALUE — not suitable for regulatory reporting.
 */
export const PROXY_FACTOR_WASTE_KG = 0.000467

// ─────────────────────────────────────────────────────────────────────────────
// Proxy Factor Assumption Strings (for AuditTrail / Scope3Record.assumptions)
// ─────────────────────────────────────────────────────────────────────────────

export const PROXY_ASSUMPTION_SPEND = (factor: number) =>
  `Spend-based proxy estimate using DEFRA 2023 factor: ${factor} tCO₂e/EUR. ` +
  `This is a placeholder value for demonstration purposes only.`

export const PROXY_ASSUMPTION_TON_KM = (factor: number) =>
  `Activity-based transport estimate using DEFRA 2023 HGV factor: ${factor} tCO₂e/tonne-km. ` +
  `This is a placeholder value for demonstration purposes only.`

export const PROXY_ASSUMPTION_WASTE = (factor: number) =>
  `Activity-based waste estimate using DEFRA 2023 landfill factor: ${factor} tCO₂e/kg. ` +
  `This is a placeholder value for demonstration purposes only.`
```

**Usage in supplier form route handler (`src/app/api/public/supplier/[token]/route.ts`):**

```typescript
// Compute tCO₂e from submitted activity data
let valueTco2e: number
let calculationMethod: string
let assumptions: string
let confidence: number

if (spend_eur !== undefined) {
  valueTco2e = spend_eur * PROXY_FACTOR_SPEND
  calculationMethod = "spend_based"
  assumptions = PROXY_ASSUMPTION_SPEND(PROXY_FACTOR_SPEND)
  confidence = 0.4
} else if (ton_km !== undefined) {
  valueTco2e = ton_km * PROXY_FACTOR_TON_KM
  calculationMethod = "activity_based"
  assumptions = PROXY_ASSUMPTION_TON_KM(PROXY_FACTOR_TON_KM)
  confidence = 0.5
} else if (waste_kg !== undefined) {
  valueTco2e = waste_kg * PROXY_FACTOR_WASTE_KG
  calculationMethod = "activity_based"
  assumptions = PROXY_ASSUMPTION_WASTE(PROXY_FACTOR_WASTE_KG)
  confidence = 0.5
}
```

**Confidence values for proxy estimates:**
- Spend-based: `0.4` (low — rough proxy, single factor, no activity detail)
- Transport/waste activity: `0.5` (slightly better — physical activity unit used)
