# Architecture: GreenLedger MVP

## Status

Approved

## Overview

GreenLedger is a full-stack Next.js 14+ application for CSRD/ESRS E1 climate reporting.
The MVP delivers a single-company demo that collects Scope 1, 2, and 3 emissions data,
calculates proxy estimates, manages methodology notes, and generates an audit-ready PDF report.

**Key architectural decisions (see linked ADRs):**

| Decision | ADR | Choice |
|----------|-----|--------|
| PDF export library | [ADR-001](../../adr-001-pdf-export.md) | `@react-pdf/renderer` |
| Database engine | [ADR-002](../../adr-002-database.md) | SQLite via Prisma |
| Project structure | [ADR-003](../../adr-003-project-structure.md) | Mono-repo, all source in `src/` |

---

## 1. Project Structure

All application code lives under `src/`. See [ADR-003](../../adr-003-project-structure.md)
for the full annotated directory tree. Summary:

```
src/
  app/            # Next.js App Router: pages + API route handlers
  components/     # Reusable React components (layout, ui)
  lib/            # Shared logic: Prisma client, constants, calculations, PDF
  prisma/         # schema.prisma, migrations/, seed.ts
  public/         # Static assets
  package.json    # npm package ("green-ledger")
  Dockerfile
  next.config.mjs / tsconfig.json / eslint.config.mjs
  tailwind.config.ts / vitest.config.ts
```

### Route structure (pages)

| URL | File | Description |
|-----|------|-------------|
| `/` | `app/page.tsx` | Redirect → `/dashboard` |
| `/dashboard` | `app/dashboard/page.tsx` | KPI cards for Scope 1, 2, 3, Total |
| `/suppliers` | `app/suppliers/page.tsx` | Supplier CRUD + token management |
| `/scope-1` | `app/scope-1/page.tsx` | Scope 1 records: list + add |
| `/scope-2` | `app/scope-2/page.tsx` | Scope 2 records: list + add |
| `/scope-3` | `app/scope-3/page.tsx` | Categories panel + records panel |
| `/methodology` | `app/methodology/page.tsx` | Per-scope note editor |
| `/export` | `app/export/page.tsx` | PDF download trigger |
| `/public/supplier/[token]` | `app/public/supplier/[token]/page.tsx` | Public supplier form (no nav) |

### API route structure

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| GET | `/api/dashboard` | `app/api/dashboard/route.ts` | Scope 1/2/3 totals + grand total |
| GET | `/api/suppliers` | `app/api/suppliers/route.ts` | List all suppliers |
| POST | `/api/suppliers` | `app/api/suppliers/route.ts` | Create supplier (auto-generates token) |
| GET | `/api/suppliers/[id]` | `app/api/suppliers/[id]/route.ts` | Get single supplier |
| PUT | `/api/suppliers/[id]` | `app/api/suppliers/[id]/route.ts` | Update supplier fields |
| DELETE | `/api/suppliers/[id]` | `app/api/suppliers/[id]/route.ts` | Set status = "inactive" |
| POST | `/api/suppliers/[id]/token` | `app/api/suppliers/[id]/token/route.ts` | Refresh public form token |
| GET | `/api/scope1` | `app/api/scope1/route.ts` | List Scope 1 records |
| POST | `/api/scope1` | `app/api/scope1/route.ts` | Create Scope 1 record |
| DELETE | `/api/scope1/[id]` | `app/api/scope1/[id]/route.ts` | Delete Scope 1 record |
| GET | `/api/scope2` | `app/api/scope2/route.ts` | List Scope 2 records |
| POST | `/api/scope2` | `app/api/scope2/route.ts` | Create Scope 2 record |
| DELETE | `/api/scope2/[id]` | `app/api/scope2/[id]/route.ts` | Delete Scope 2 record |
| GET | `/api/scope3/categories` | `app/api/scope3/categories/route.ts` | List all 15 categories |
| PUT | `/api/scope3/categories/[id]` | `app/api/scope3/categories/[id]/route.ts` | Update material / materialityReason |
| GET | `/api/scope3/records` | `app/api/scope3/records/route.ts` | List Scope 3 records |
| POST | `/api/scope3/records` | `app/api/scope3/records/route.ts` | Create Scope 3 record manually |
| DELETE | `/api/scope3/records/[id]` | `app/api/scope3/records/[id]/route.ts` | Delete Scope 3 record |
| GET | `/api/methodology` | `app/api/methodology/route.ts` | Get all three methodology notes |
| PUT | `/api/methodology` | `app/api/methodology/route.ts` | Upsert methodology note (per scope) |
| GET | `/api/export/pdf` | `app/api/export/pdf/route.ts` | Generate + stream PDF; logs audit event |
| GET | `/api/supplier-form/[token]` | `app/api/supplier-form/[token]/route.ts` | Look up supplier by token (public) |
| POST | `/api/supplier-form/[token]` | `app/api/supplier-form/[token]/route.ts` | Submit supplier form; creates Scope3Record |

---

## 2. Database Schema Design

See [ADR-002](../../adr-002-database.md) for the database engine decision and portability rules.

### Prisma schema overview

```prisma
// src/prisma/schema.prisma

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ─── Enums ────────────────────────────────────────────────────────────────────

enum OrgBoundary {
  operational_control
  financial_control
  equity_share
}

enum SupplierStatus {
  active
  inactive
}

enum Scope12DataSource {
  manual
  csv_import
}

enum CalculationMethod {
  spend_based
  activity_based
  supplier_specific
}

enum Scope3DataSource {
  supplier_form
  csv_import
  proxy
}

enum MethodologyScope {
  scope_1
  scope_2
  scope_3
}

enum AuditEntityType {
  supplier
  scope1
  scope2
  scope3
  methodology
  export
}

enum AuditAction {
  created
  updated
  submitted
  exported
}

// ─── Models ───────────────────────────────────────────────────────────────────

model Company {
  id            String        @id @default(uuid())
  name          String
  country       String        @default("DE")
  reportingYear Int
  orgBoundary   OrgBoundary

  suppliers        Supplier[]
  scope1Records    Scope1Record[]
  scope2Records    Scope2Record[]
  scope3Records    Scope3Record[]
  methodologyNotes MethodologyNote[]
  auditEvents      AuditTrailEvent[]
}

model Supplier {
  id              String         @id @default(uuid())
  companyId       String
  name            String
  country         String
  sector          String
  contactEmail    String
  publicFormToken String         @unique
  status          SupplierStatus @default(active)

  company       Company        @relation(fields: [companyId], references: [id])
  scope3Records Scope3Record[]
}

model Scope1Record {
  id                   String            @id @default(uuid())
  companyId            String
  periodYear           Int
  valueTco2e           Float
  calculationMethod    String
  emissionFactorsSource String
  dataSource           Scope12DataSource
  assumptions          String?
  createdAt            DateTime          @default(now())

  company Company @relation(fields: [companyId], references: [id])
}

model Scope2Record {
  id                   String            @id @default(uuid())
  companyId            String
  periodYear           Int
  valueTco2e           Float
  calculationMethod    String
  emissionFactorsSource String
  dataSource           Scope12DataSource
  assumptions          String?
  createdAt            DateTime          @default(now())

  company Company @relation(fields: [companyId], references: [id])
}

model Scope3Category {
  id               String  @id @default(uuid())
  code             String  @unique   // "C1" … "C15"
  name             String
  material         Boolean @default(false)
  materialityReason String?

  records Scope3Record[]
}

model Scope3Record {
  id                  String            @id @default(uuid())
  companyId           String
  supplierId          String?
  categoryId          String
  periodYear          Int
  valueTco2e          Float
  calculationMethod   CalculationMethod
  emissionFactorSource String
  dataSource          Scope3DataSource
  assumptions         String?
  confidence          Float             // 0.0–1.0
  activityDataJson    Json?             // Stored as TEXT on SQLite; Prisma handles serialisation transparently
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt

  company  Company        @relation(fields: [companyId], references: [id])
  supplier Supplier?      @relation(fields: [supplierId], references: [id])
  category Scope3Category @relation(fields: [categoryId], references: [id])
}

model MethodologyNote {
  id        String           @id @default(uuid())
  companyId String
  scope     MethodologyScope
  text      String
  updatedAt DateTime         @updatedAt

  company Company @relation(fields: [companyId], references: [id])

  @@unique([companyId, scope])
}

model AuditTrailEvent {
  id         String          @id @default(uuid())
  companyId  String
  entityType AuditEntityType
  entityId   String
  action     AuditAction
  actor      String          // "system" | "supplier" | "user"
  timestamp  DateTime        @default(now())
  comment    String?

  company Company @relation(fields: [companyId], references: [id])
}
```

### Schema notes

- `Scope3Record.activityDataJson` uses Prisma's `Json?` type. On SQLite, Prisma stores this
  as TEXT and handles serialisation/deserialisation transparently; on PostgreSQL it maps to
  `jsonb`. No application-layer `JSON.parse` / `JSON.stringify` is required.
- All UUIDs are generated by Prisma (`@default(uuid())`), not the database engine, ensuring
  portability.
- `MethodologyNote` has a compound unique constraint `[companyId, scope]` to enforce one note
  per scope per company, enabling clean upsert logic.

---

## 3. Proxy Calculation Design

### Constants (`src/lib/constants.ts`)

The following constants are **placeholder values** for the demo. They must be clearly
documented as such and easy to replace with verified factors in a production version.

```ts
// src/lib/constants.ts

/**
 * PROXY EMISSION FACTORS — PLACEHOLDER VALUES (demo only)
 *
 * These factors are illustrative and NOT suitable for real CSRD reporting.
 * Replace with verified factors from DEFRA, ecoinvent, or an EF database
 * before any production or regulatory use.
 */

/** kgCO2e per EUR of spend (spend-based proxy, Scope 3 Category 1) */
export const PROXY_FACTOR_SPEND_KG_PER_EUR = 0.5;

/** kgCO2e per tonne-kilometre (transport proxy, Scope 3 Category 4) */
export const PROXY_FACTOR_TRANSPORT_KG_PER_TON_KM = 0.1;

/** kgCO2e per kilogram of waste (waste proxy, Scope 3 Category 5) */
export const PROXY_FACTOR_WASTE_KG_PER_KG = 2.0;

/** Confidence score assigned to all proxy-calculated records */
export const PROXY_CONFIDENCE = 0.5;

/** Human-readable source string stored on proxy records */
export const PROXY_FACTOR_SOURCE = "DEFRA spend-based proxy 2023 – placeholder value";
export const TRANSPORT_FACTOR_SOURCE = "DEFRA road freight proxy 2023 – placeholder value";
export const WASTE_FACTOR_SOURCE = "DEFRA waste disposal proxy 2023 – placeholder value";

/** Standard assumptions text stored on proxy records */
export const PROXY_ASSUMPTIONS_SPEND =
  "Spend-based proxy applied. Actual emission intensity of supplier not known. " +
  "Factor: 0.5 kgCO2e/EUR (placeholder). Confidence: 0.5.";
export const PROXY_ASSUMPTIONS_TRANSPORT =
  "Transport proxy applied. Factor: 0.1 kgCO2e/tonne-km (placeholder). Confidence: 0.5.";
export const PROXY_ASSUMPTIONS_WASTE =
  "Waste proxy applied. Factor: 2.0 kgCO2e/kg (placeholder). Confidence: 0.5.";
```

### Calculation logic (`src/lib/calculations.ts`)

The proxy calculation function selects the most specific activity data available and applies
the appropriate factor. Priority order: `waste_kg` (more specific) > `ton_km` > `spend_eur`.

```ts
interface ActivityData {
  spend_eur?: number;
  ton_km?: number;
  waste_kg?: number;
}

interface ProxyResult {
  valueTco2e: number;
  calculationMethod: 'spend_based' | 'activity_based';
  emissionFactorSource: string;
  assumptions: string;
  confidence: number;
  dataSource: 'proxy';
}

function calculateProxy(activity: ActivityData): ProxyResult
```

The function converts the kgCO2e result to tCO2e by dividing by 1000.

**Data-source determination on supplier form submission:**

- If the submitted data contains `spend_eur` only → `dataSource = "proxy"`, `calculationMethod = "spend_based"`
- If `ton_km` provided → `dataSource = "proxy"`, `calculationMethod = "activity_based"`
- If `waste_kg` provided → `dataSource = "proxy"`, `calculationMethod = "activity_based"`
- If multiple fields are submitted, use priority: `waste_kg` > `ton_km` > `spend_eur`
- The `dataSource` on the resulting `Scope3Record` is always `"supplier_form"` when the record
  originates from the public form, unless the submitted data requires a proxy (no supplier-specific
  factor is available), in which case it becomes `"proxy"`.

---

## 4. PDF Export Pipeline

See [ADR-001](../../adr-001-pdf-export.md) for the library decision.

### Data flow

```
GET /api/export/pdf
  │
  ├─ 1. Fetch report data from DB via Prisma:
  │      - Company (name, reportingYear)
  │      - Scope1Records (sum for reportingYear)
  │      - Scope2Records (sum for reportingYear)
  │      - Scope3Records (sum + breakdown by category for reportingYear)
  │      - Scope3Categories (all, with material flag)
  │      - MethodologyNotes (all three scopes)
  │      - Scope3Records where dataSource="proxy" OR confidence<1 OR assumptions≠null
  │
  ├─ 2. Build ReportData object (typed, pre-formatted numbers)
  │
  ├─ 3. Call generateReport(data: ReportData): Promise<Buffer>
  │      - Renders <CsrdReport data={data} /> using @react-pdf/renderer
  │      - Returns PDF byte buffer
  │
  ├─ 4. Create AuditTrailEvent (action: "exported", entityType: "export")
  │
  └─ 5. Return Response with:
         Content-Type: application/pdf
         Content-Disposition: attachment; filename="GreenLedger_CSRD_Report_2024.pdf"
```

### Report component structure (`src/lib/pdf/components.tsx`)

```
<CsrdReport>
  <CoverPage>           company name, reportingYear, generated date
  <SummaryTable>        Scope 1 | Scope 2 | Scope 3 | Total (tCO2e, 2dp)
  <Scope3Breakdown>     Material categories only; aggregate note if non-material records exist
  <MethodologySection>  One sub-section per scope; pulls from MethodologyNote
  <DataQualityTable>    Rows: supplier, category, dataSource, assumptions, confidence
                        Filtered: dataSource="proxy" OR confidence<1 OR assumptions≠""
```

---

## 5. Scope 3 Category Seed Data

All 15 GHG Protocol Scope 3 categories are pre-seeded with `material = false`. The demo
seed marks **C1** and **C4** as material to enable a meaningful PDF export in the 5-minute
demo flow.

| Code | Category Name | Demo material? |
|------|--------------|---------------|
| C1 | Purchased goods & services | ✅ |
| C2 | Capital goods | — |
| C3 | Fuel- and energy-related activities | — |
| C4 | Upstream transportation & distribution | ✅ |
| C5 | Waste generated in operations | — |
| C6 | Business travel | — |
| C7 | Employee commuting | — |
| C8 | Upstream leased assets | — |
| C9 | Downstream transportation & distribution | — |
| C10 | Processing of sold products | — |
| C11 | Use of sold products | — |
| C12 | End-of-life treatment of sold products | — |
| C13 | Downstream leased assets | — |
| C14 | Franchises | — |
| C15 | Investments | — |

---

## 6. Seed Data Structure

The Prisma seed script (`src/prisma/seed.ts`) creates the following demo data to enable the
5-minute demo flow without manual data entry:

### Company (1 record)

```
name:          "Musterfirma GmbH"
country:       "DE"
reportingYear: 2024
orgBoundary:   "operational_control"
```

### Scope 3 Categories (15 records, all pre-seeded)

See table in section 5 above. C1 and C4 seeded with `material = true`.

C1 `materialityReason`:
> "Primary spend category — purchased goods represent the largest share of supply chain emissions."

C4 `materialityReason`:
> "Upstream logistics is material for a manufacturing company with distributed suppliers."

### Suppliers (3 records)

| Name | Country | Sector | Contact | Status |
|------|---------|--------|---------|--------|
| Lieferant Alpha GmbH | DE | Manufacturing | alpha@example.com | active |
| Beta Logistics KG | DE | Transport | beta@example.com | active |
| Gamma Werkstoffe AG | AT | Raw materials | gamma@example.com | active |

Each supplier gets a randomly generated `publicFormToken` at seed time.

### Scope 1 Records (2 records)

| Year | Value (tCO₂e) | Method | Factor Source | Data Source |
|------|--------------|--------|--------------|-------------|
| 2024 | 45.20 | Natural gas combustion, DEFRA factors | DEFRA 2023 | manual |
| 2024 | 12.80 | Company vehicle fleet, DEFRA factors | DEFRA 2023 | manual |

### Scope 2 Records (1 record)

| Year | Value (tCO₂e) | Method | Factor Source | Data Source |
|------|--------------|--------|--------------|-------------|
| 2024 | 38.50 | Location-based, German grid factor | UBA 2023 | manual |

### Scope 3 Records (3 records)

| Supplier | Category | Year | Value (tCO₂e) | Method | DataSource | Confidence |
|----------|----------|------|--------------|--------|-----------|-----------|
| Lieferant Alpha GmbH | C1 | 2024 | 125.00 | spend_based (proxy) | proxy | 0.5 |
| Beta Logistics KG | C4 | 2024 | 78.30 | activity_based (proxy) | proxy | 0.5 |
| (no supplier) | C1 | 2024 | 55.00 | spend_based (proxy) | proxy | 0.5 |

Assumptions and emission factor source strings are populated from the constants defined in
`src/lib/constants.ts`.

### Methodology Notes (3 records, one per scope)

- **Scope 1:** "Scope 1 emissions calculated using DEFRA 2023 conversion factors for natural
  gas combustion and company-owned vehicle fuel consumption. Organisational boundary:
  operational control."
- **Scope 2:** "Scope 2 emissions calculated using the location-based method. German national
  grid emission factor sourced from UBA (Umweltbundesamt) 2023 report."
- **Scope 3:** "Scope 3 emissions estimated using spend-based and activity-based proxy factors
  from DEFRA 2023. All proxy values carry a confidence score of 0.5. Materiality assessed
  against GHG Protocol guidance; Categories C1 and C4 identified as material for this
  reporting entity."

### AuditTrailEvents

The seed script creates initial `"created"` audit events for each seeded supplier and each
seeded Scope 1/2/3 record, with `actor = "system"`.

---

## 7. Default Route

The application root `/` renders a Next.js `redirect('/dashboard')` in `app/page.tsx`.
There is no splash/landing screen. All navigation is accessible from the persistent sidebar
rendered in `app/layout.tsx`.

The public supplier form at `/public/supplier/[token]` is intentionally excluded from the
sidebar navigation (it is a standalone page for external suppliers).

---

## 8. Component Architecture

### Layout components

- **`app/layout.tsx`** — Root HTML shell. Renders the `<Sidebar>` component for all routes
  except `/public/**`. Uses Next.js `pathname` (via `usePathname` in a Client Component wrapper)
  to conditionally hide the sidebar on public pages.
- **`components/layout/Sidebar.tsx`** — Navigation links to all internal pages. Highlights
  the active route. Client component (`"use client"`) to use `usePathname`.
- **`components/layout/PageHeader.tsx`** — Page title and optional breadcrumb. Server component.

### UI components

- **`components/ui/KpiCard.tsx`** — Displays a labelled numeric metric in tCO₂e.
  Props: `label: string`, `value: number`, `trend?: 'up' | 'down' | 'neutral'`.
- **`components/ui/DataTable.tsx`** — Generic table with typed column definitions and row data.
  Server component; sorting/filtering can be added client-side if needed.
- **`components/ui/FormModal.tsx`** — Modal overlay with a slot for form content. Client
  component (uses `useState` for open/close).
- **`components/ui/StatusBadge.tsx`** — Coloured pill for `"active"` / `"inactive"` status
  values. Server component.

### Page-level data flow

Pages use **React Server Components** to fetch data directly via Prisma and pass it as props
to child components. Client components (forms, modals, interactive tables) receive initial data
as props and call API routes for mutations via `fetch`.

```
app/dashboard/page.tsx  (Server Component)
  └─ fetches: prisma.scope1Record.aggregate(), scope2Record.aggregate(), scope3Record.aggregate()
  └─ renders: <KpiCard> × 4
```

```
app/suppliers/page.tsx  (Server Component — initial data)
  └─ fetches: prisma.supplier.findMany()
  └─ renders: <SuppliersClient data={suppliers} />  ("use client" wrapper for mutations)
```

---

## 9. Security Considerations

The MVP intentionally has no authentication. The following mitigations apply for the
supplier form endpoint:

- **Token opacity:** `publicFormToken` is a UUID v4 (128 bits of entropy); enumeration
  is computationally infeasible for a demo.
- **Inactive supplier guard:** `GET /api/supplier-form/[token]` returns 404 if the supplier
  `status = "inactive"`. The public form page shows an error message.
- **Input validation:** The supplier form API validates that at least one numeric activity
  field is provided and that values are positive numbers.
- **No PII stored:** The supplier form collects only numeric activity values. No supplier
  employee personal data is stored.

---

## 10. Open Questions — Resolved

| # | Question | Decision |
|---|----------|----------|
| 1 | PDF library | `@react-pdf/renderer` — see ADR-001 |
| 2 | Proxy factor values | Placeholder values documented in `lib/constants.ts` — see § 3 |
| 3 | Scope3Category seed data | All 15 GHG Protocol categories; C1 + C4 marked material — see § 5 |
| 4 | Default route | `/` redirects to `/dashboard` — see § 7 |
| 5 | Demo seed scope | 1 company, 15 categories, 3 suppliers, 2× Scope 1, 1× Scope 2, 3× Scope 3, 3× MethodologyNote — see § 6 |
