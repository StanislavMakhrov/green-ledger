# ADR-002: Demo Seed Data Strategy

## Status

Accepted

## Context

GreenLedger is a single-company demo application. On first startup (via `docker compose up` or
`make dev`), the database is empty. The Prisma seed script (`src/prisma/seed.ts`) must
populate the database with the data required for the application to function and to support a
compelling 5-minute demo.

The Feature Specification open question asks:

> "Should the Prisma seed script populate sample Scope 1/2/3 records (to make the dashboard
> non-empty on first run), or start with a blank database? A pre-populated demo is more
> compelling for a 5-minute demo flow."

Requirements:
- All 15 ESRS Scope 3 categories (C1–C15) must be seeded (they are required for the app to function)
- The demo company must be seeded with a fixed, well-known ID
- Seed must be idempotent (safe to re-run; uses `upsert`)
- Seed must support a `REPORTING_YEAR` environment variable override (defaults to `2024`)

## Options Considered

### Option 1: Minimal Seed (Company + Categories Only)

Seed only the structural data required for the app to operate:
- Demo `Company` row
- All 15 `Scope3Category` rows
- Three `MethodologyNote` rows (empty text, one per scope)

Dashboard shows all zeros on first load. User must manually add records to see meaningful data.

**Pros:**
- Seed script is simple and short
- Clean-slate experience — nothing pre-fabricated

**Cons:**
- Dashboard KPIs show 0/0/0/0 on first launch — not impressive for a demo
- A 5-minute demo requires the presenter to manually enter data before the demo begins
- Harder for evaluators to understand the product's value at a glance

### Option 2: Rich Seed (Company + Categories + Sample Records)

Seed all structural data plus a realistic set of demo records:
- Demo `Company`
- 15 `Scope3Category` rows (several pre-marked as material)
- 2–3 `Supplier` rows with unique tokens
- 2–3 `Scope1Record` rows
- 1–2 `Scope2Record` rows
- 5–7 `Scope3Record` rows (mix of supplier-specific, spend-based proxy, activity-based)
- 3 `MethodologyNote` rows (pre-populated with plausible demo text)

Dashboard shows meaningful KPI values immediately. The supplier table shows pre-existing
suppliers and their form links ready to copy.

**Pros:**
- Dashboard is immediately compelling for a demo
- Demonstrates all features (proxy records, confidence scores, material categories) without
  manual setup
- Scope 3 breakdown in PDF export shows material categories right away
- "Assumptions & Data Quality" section has data to display

**Cons:**
- Seed script is longer (~150 lines)
- Sample data is fabricated; must be clearly labelled as demo data

## Decision

**Use a rich seed (Option 2).**

## Rationale

The product's primary purpose at this stage is to demonstrate value in a 5-minute demo flow
(as stated in `docs/spec.md`). A dashboard showing all zeros fails to communicate the product's
capabilities and forces manual setup before every demo.

The seed data must cover all major features:
- Records with varying `confidence` values (to populate the PDF assumptions table)
- Records with `dataSource = "proxy"` (to show proxy calculation in action)
- Several material categories (to show the Scope 3 breakdown in the PDF)
- Pre-populated methodology notes (to show the methodology section in the PDF)

The seed is idempotent via `upsert` operations, so re-running it is safe.

## Consequences

### Positive
- Product is demo-ready immediately after `docker compose up`
- All PDF sections contain data on first export
- Reviewers and evaluators see a credible, realistic data set
- `REPORTING_YEAR` override allows the seed to stay current without code changes

### Negative
- Seed data is fabricated — must include a comment in the seed file noting it is for
  demonstration only
- Seed script requires maintenance if the schema changes

## Implementation Notes

For the Developer agent:

**File:** `src/prisma/seed.ts`

**Fixed constants to use:**
- `DEMO_COMPANY_ID = "demo-company-001"` — imported from `src/lib/constants.ts`
- `REPORTING_YEAR` — read from `process.env.REPORTING_YEAR ?? "2024"` and parsed as `parseInt`

**Seed script structure:**

```
1. Upsert Company:
   id: DEMO_COMPANY_ID
   name: "Acme GmbH"
   country: "DE"
   reportingYear: REPORTING_YEAR
   orgBoundary: "operational_control"

2. Upsert all 15 Scope3Categories (using code as unique key):
   C1  Purchased goods & services          material: true
   C2  Capital goods                        material: false
   C3  Fuel- and energy-related activities  material: true
   C4  Upstream transportation              material: true
   C5  Waste generated in operations        material: false
   C6  Business travel                      material: false
   C7  Employee commuting                   material: false
   C8  Upstream leased assets               material: false
   C9  Downstream transportation            material: false
   C10 Processing of sold products          material: false
   C11 Use of sold products                 material: false
   C12 End-of-life treatment                material: false
   C13 Downstream leased assets             material: false
   C14 Franchises                           material: false
   C15 Investments                          material: false

   Pre-mark C1, C3, C4 as material (with materialityReason)

3. Upsert 3 Suppliers (unique token per supplier):
   - "Müller Maschinenbau GmbH" (DE, Manufacturing)
   - "Transport Logistik AG"    (DE, Transport)
   - "Office Supplies Co."      (NL, Wholesale)

4. Upsert 3 Scope1Records (periodYear = REPORTING_YEAR):
   - Natural gas combustion: 45.2 tCO₂e, DEFRA 2023
   - Company vehicles:       12.8 tCO₂e, DEFRA 2023
   - Refrigerant leakage:     3.1 tCO₂e, DEFRA 2023

5. Upsert 2 Scope2Records (periodYear = REPORTING_YEAR, location-based):
   - Grid electricity:     28.5 tCO₂e, German grid factor 2023
   - District heating:      9.2 tCO₂e, local supplier factor

6. Upsert 6 Scope3Records (periodYear = REPORTING_YEAR):
   - C1, supplier "Müller Maschinenbau GmbH":
       spend_based, supplier_form, 1165 tCO₂e, confidence 0.4
       (reflects a demo supplier form submission)
   - C1, no supplier:
       spend_based, proxy, 420 tCO₂e, confidence 0.3
   - C3, no supplier:
       activity_based, proxy, 55.0 tCO₂e, confidence 0.5
   - C4, supplier "Transport Logistik AG":
       activity_based, supplier_form, 78.3 tCO₂e, confidence 0.7
   - C6, no supplier:
       activity_based, manual, 12.0 tCO₂e, confidence 1.0
   - C7, no supplier:
       activity_based, proxy, 8.5 tCO₂e, confidence 0.5

7. Upsert 3 MethodologyNotes:
   scope_1: "Scope 1 emissions calculated using DEFRA 2023 emission factors ..."
   scope_2: "Scope 2 emissions calculated using the location-based method ..."
   scope_3: "Scope 3 emissions collected via supplier questionnaires and
             spend-based proxies. Proxy factor: 0.233 tCO₂e/EUR (DEFRA
             spend-based placeholder — not authoritative for regulatory use)."
```

**`package.json` seed config:**
```json
"prisma": {
  "seed": "ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts"
}
```
Or use `tsx prisma/seed.ts` (preferred if `tsx` is in devDependencies).

**Script in `package.json`:**
```json
"db:seed": "prisma db seed"
```
