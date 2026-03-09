# Architecture: GreenLedger MVP

## Status

Approved — implemented by ADR-001 through ADR-004.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Browser / Client                           │
│                                                                     │
│  ┌──────────────┐  ┌───────────────────────────────────────────┐   │
│  │  App UI      │  │  Public Supplier Form                     │   │
│  │  (App Router │  │  /public/supplier/[token]                 │   │
│  │   route grp) │  │  (no auth, public route group)            │   │
│  └──────┬───────┘  └──────────────────┬────────────────────────┘   │
└─────────┼────────────────────────────┼──────────────────────────────┘
          │ HTTP fetch (JSON)           │ HTTP fetch (JSON)
          ▼                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Next.js App (Node.js)                           │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Route Handlers  (src/app/api/**/route.ts)                   │   │
│  │                                                              │   │
│  │  /api/dashboard    /api/suppliers/**   /api/scope1/**        │   │
│  │  /api/scope2/**    /api/scope3/**      /api/methodology      │   │
│  │  /api/export       /api/public/supplier/[token]              │   │
│  └────────────────────────┬─────────────────────────────────────┘   │
│                           │                                         │
│  ┌────────────────────────▼─────────────────────────────────────┐   │
│  │  Business Logic Layer  (src/lib/)                            │   │
│  │                                                              │   │
│  │  prisma.ts  ·  constants.ts  ·  audit.ts  ·  utils.ts       │   │
│  │  pdf/generate-report.ts  ·  pdf/report-template.tsx         │   │
│  └────────────────────────┬─────────────────────────────────────┘   │
│                           │  Prisma Client                         │
│  ┌────────────────────────▼─────────────────────────────────────┐   │
│  │  Database (SQLite dev / Postgres prod)                       │   │
│  │                                                              │   │
│  │  Company · Supplier · Scope1Record · Scope2Record            │   │
│  │  Scope3Category · Scope3Record · MethodologyNote             │   │
│  │  AuditTrailEvent                                             │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Directory / File Structure (`src/`)

```
src/
├── package.json                         # npm package definition
├── Dockerfile                           # Docker image build
├── next.config.mjs                      # Next.js config
├── tsconfig.json                        # TypeScript strict config
├── eslint.config.mjs                    # ESLint + Prettier config
├── tailwind.config.ts                   # Tailwind CSS config
├── postcss.config.mjs                   # PostCSS config
├── .env.example                         # Template for DATABASE_URL etc.
│
├── app/                                 # Next.js App Router root
│   ├── layout.tsx                       # Root HTML shell (html, body, fonts)
│   ├── page.tsx                         # Redirect → /dashboard
│   ├── globals.css                      # Tailwind directives, CSS vars
│   │
│   ├── (app)/                           # Route group: authenticated-like UI
│   │   ├── layout.tsx                   # Sidebar nav + main content wrapper
│   │   ├── dashboard/
│   │   │   └── page.tsx                 # KPI cards (server component)
│   │   ├── suppliers/
│   │   │   └── page.tsx                 # Supplier table + forms (client)
│   │   ├── scope-1/
│   │   │   └── page.tsx                 # Scope 1 list + add form
│   │   ├── scope-2/
│   │   │   └── page.tsx                 # Scope 2 list + add form
│   │   ├── scope-3/
│   │   │   └── page.tsx                 # Categories + records (tabbed)
│   │   ├── methodology/
│   │   │   └── page.tsx                 # Methodology note editors
│   │   └── export/
│   │       └── page.tsx                 # PDF export trigger page
│   │
│   ├── (public)/                        # Route group: public pages (no nav)
│   │   └── public/
│   │       └── supplier/
│   │           └── [token]/
│   │               └── page.tsx         # Supplier self-service form
│   │
│   └── api/                             # Route Handlers (see API Design below)
│       ├── dashboard/
│       │   └── route.ts                 # GET  → scope totals
│       ├── suppliers/
│       │   ├── route.ts                 # GET list | POST create
│       │   └── [id]/
│       │       ├── route.ts             # GET | PUT | DELETE
│       │       └── refresh-token/
│       │           └── route.ts         # POST refresh publicFormToken
│       ├── scope1/
│       │   ├── route.ts                 # GET list | POST create
│       │   └── [id]/
│       │       └── route.ts             # DELETE
│       ├── scope2/
│       │   ├── route.ts                 # GET list | POST create
│       │   └── [id]/
│       │       └── route.ts             # DELETE
│       ├── scope3/
│       │   ├── categories/
│       │   │   ├── route.ts             # GET all categories
│       │   │   └── [id]/
│       │   │       └── route.ts         # PUT material / materialityReason
│       │   └── records/
│       │       ├── route.ts             # GET list | POST create
│       │       └── [id]/
│       │           └── route.ts         # DELETE
│       ├── methodology/
│       │   ├── route.ts                 # GET all notes
│       │   └── [scope]/
│       │       └── route.ts             # PUT upsert note for scope
│       ├── export/
│       │   └── route.ts                 # POST → PDF binary
│       └── public/
│           └── supplier/
│               └── [token]/
│                   └── route.ts         # GET supplier info | POST submit
│
├── components/
│   ├── ui/                              # Primitive / design-system components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Textarea.tsx
│   │   ├── Badge.tsx
│   │   ├── Table.tsx
│   │   └── Spinner.tsx
│   ├── layout/
│   │   ├── Sidebar.tsx                  # "use client" — active link state
│   │   └── PageHeader.tsx
│   ├── dashboard/
│   │   └── KpiCard.tsx
│   ├── suppliers/
│   │   ├── SupplierTable.tsx            # "use client"
│   │   ├── SupplierForm.tsx             # "use client"
│   │   └── SupplierTokenActions.tsx     # "use client" (clipboard API)
│   ├── scope1/
│   │   ├── Scope1RecordTable.tsx        # "use client"
│   │   └── Scope1RecordForm.tsx         # "use client"
│   ├── scope2/
│   │   ├── Scope2RecordTable.tsx        # "use client"
│   │   └── Scope2RecordForm.tsx         # "use client"
│   ├── scope3/
│   │   ├── CategoryList.tsx             # "use client"
│   │   ├── Scope3RecordTable.tsx        # "use client"
│   │   └── Scope3RecordForm.tsx         # "use client"
│   ├── methodology/
│   │   └── MethodologyEditor.tsx        # "use client"
│   ├── export/
│   │   └── ExportButton.tsx             # "use client" (fetch + download)
│   └── public/
│       └── SupplierPublicForm.tsx       # "use client"
│
├── lib/
│   ├── prisma.ts                        # Prisma client singleton
│   ├── constants.ts                     # DEMO_COMPANY_ID, PROXY_FACTORs,
│   │                                    #   REPORTING_YEAR, SCOPE3_CATEGORIES
│   ├── audit.ts                         # createAuditEvent() helper
│   ├── utils.ts                         # formatTco2e(), cn(), etc.
│   └── pdf/
│       ├── generate-report.ts           # Orchestrates data fetch + rendering
│       └── report-template.tsx          # @react-pdf/renderer Document tree
│
└── prisma/
    ├── schema.prisma                    # Prisma schema (SQLite dev, Postgres prod)
    ├── migrations/                      # Auto-generated migration files
    └── seed.ts                          # Demo data seed script
```

---

## API Routes Design

All routes are under `src/app/api/`. Route handlers follow REST conventions.
All responses are `application/json` (except `POST /api/export` which returns `application/pdf`).
All write operations create an `AuditTrailEvent` using the `createAuditEvent()` helper.

### Dashboard

| Method | Path | Description | Response |
|--------|------|-------------|----------|
| `GET` | `/api/dashboard` | Scope totals for configured reporting year | `{ scope1: number, scope2: number, scope3: number, total: number, reportingYear: number }` |

### Suppliers

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|--------------|----------|
| `GET` | `/api/suppliers` | List all suppliers | — | `Supplier[]` |
| `POST` | `/api/suppliers` | Create supplier | `{ name, country, sector, contactEmail }` | `Supplier` |
| `GET` | `/api/suppliers/[id]` | Get supplier by ID | — | `Supplier` |
| `PUT` | `/api/suppliers/[id]` | Update supplier | `{ name?, country?, sector?, contactEmail?, status? }` | `Supplier` |
| `DELETE` | `/api/suppliers/[id]` | Delete supplier | — | `{ success: true }` |
| `POST` | `/api/suppliers/[id]/refresh-token` | Regenerate public form token | — | `{ publicFormToken: string }` |

### Scope 1

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|--------------|----------|
| `GET` | `/api/scope1` | List Scope 1 records | — | `Scope1Record[]` |
| `POST` | `/api/scope1` | Create Scope 1 record | `{ periodYear, valueTco2e, calculationMethod, emissionFactorsSource, dataSource, assumptions? }` | `Scope1Record` |
| `DELETE` | `/api/scope1/[id]` | Delete Scope 1 record | — | `{ success: true }` |

### Scope 2

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|--------------|----------|
| `GET` | `/api/scope2` | List Scope 2 records | — | `Scope2Record[]` |
| `POST` | `/api/scope2` | Create Scope 2 record | `{ periodYear, valueTco2e, calculationMethod, emissionFactorsSource, dataSource, assumptions? }` | `Scope2Record` |
| `DELETE` | `/api/scope2/[id]` | Delete Scope 2 record | — | `{ success: true }` |

### Scope 3

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|--------------|----------|
| `GET` | `/api/scope3/categories` | List all 15 categories | — | `Scope3Category[]` |
| `PUT` | `/api/scope3/categories/[id]` | Update materiality | `{ material: boolean, materialityReason?: string }` | `Scope3Category` |
| `GET` | `/api/scope3/records` | List all Scope 3 records | — | `Scope3Record[]` with supplier & category |
| `POST` | `/api/scope3/records` | Create Scope 3 record | `{ categoryId, supplierId?, periodYear, valueTco2e, calculationMethod, emissionFactorSource, dataSource, assumptions?, confidence, activityDataJson? }` | `Scope3Record` |
| `DELETE` | `/api/scope3/records/[id]` | Delete Scope 3 record | — | `{ success: true }` |

### Methodology

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|--------------|----------|
| `GET` | `/api/methodology` | Get all methodology notes | — | `MethodologyNote[]` |
| `PUT` | `/api/methodology/[scope]` | Upsert note for scope | `{ text: string }` | `MethodologyNote` |

`[scope]` values: `scope_1` | `scope_2` | `scope_3`

### Export

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|--------------|----------|
| `POST` | `/api/export` | Generate and return PDF | — | `application/pdf` binary |

### Public Supplier Form

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|--------------|----------|
| `GET` | `/api/public/supplier/[token]` | Validate token, return supplier info | — | `{ supplierName: string, categories: Scope3Category[] }` |
| `POST` | `/api/public/supplier/[token]` | Submit activity data | `{ categoryId: string, spend_eur?: number, ton_km?: number, waste_kg?: number }` | `{ success: true, record: Scope3Record }` |

---

## Component Hierarchy

```
app/
  (app)/layout.tsx
    └── Sidebar.tsx                  [client] — nav links, active state
        ├── dashboard/page.tsx       [server] — fetches scope totals
        │   └── KpiCard.tsx          [server] — displays tCO₂e value
        │
        ├── suppliers/page.tsx       [server] — initial data fetch
        │   ├── SupplierTable.tsx    [client] — list, delete, copy link
        │   │   └── SupplierTokenActions.tsx  [client] — clipboard, refresh
        │   └── SupplierForm.tsx     [client] — create/edit modal
        │
        ├── scope-1/page.tsx         [server]
        │   ├── Scope1RecordTable.tsx  [client]
        │   └── Scope1RecordForm.tsx   [client]
        │
        ├── scope-2/page.tsx         [server]
        │   ├── Scope2RecordTable.tsx  [client]
        │   └── Scope2RecordForm.tsx   [client]
        │
        ├── scope-3/page.tsx         [server]
        │   ├── CategoryList.tsx       [client] — toggle material, reason
        │   ├── Scope3RecordTable.tsx  [client]
        │   └── Scope3RecordForm.tsx   [client]
        │
        ├── methodology/page.tsx     [server]
        │   └── MethodologyEditor.tsx  [client] — per-scope textarea + save
        │
        └── export/page.tsx          [server]
            └── ExportButton.tsx       [client] — fetch POST /api/export,
                                                   trigger download

  (public)/public/supplier/[token]/page.tsx   [server] — validates token
    └── SupplierPublicForm.tsx       [client] — form, POST to API
```

---

## Data Flow: Key Scenarios

### 1. Supplier Form Submission

```
Supplier Browser                      Next.js Server                    SQLite
     │                                       │                              │
     │  GET /public/supplier/[token]          │                              │
     │──────────────────────────────────────►│                              │
     │                                       │ GET /api/public/supplier/    │
     │                                       │   [token]                    │
     │                                       │──────────────────────────── ►│
     │                                       │◄─ supplier + categories ─────│
     │◄── page with pre-filled supplier name─│                              │
     │                                       │                              │
     │  POST /api/public/supplier/[token]    │                              │
     │  { categoryId, spend_eur: 5000 }      │                              │
     │──────────────────────────────────────►│                              │
     │                                       │ 1. Validate token            │
     │                                       │ 2. Compute tCO₂e:            │
     │                                       │    5000 × 0.233 = 1165       │
     │                                       │    (PROXY_FACTOR)            │
     │                                       │ 3. Create Scope3Record       │
     │                                       │    dataSource="supplier_form"│
     │                                       │    confidence=0.4            │
     │                                       │    assumptions="spend_based..│
     │                                       │    activityDataJson={...}    │
     │                                       │──────────────────────────── ►│
     │                                       │ 4. Create AuditTrailEvent    │
     │                                       │    actor="supplier"          │
     │                                       │    action="submitted"        │
     │                                       │──────────────────────────── ►│
     │◄── { success: true, record }──────────│                              │
     │  Show "Thank you" confirmation         │                              │
```

### 2. PDF Export Generation

```
Manager Browser                       Next.js Server                    SQLite
     │                                       │                              │
     │  Click "Generate Report"              │                              │
     │  POST /api/export                     │                              │
     │──────────────────────────────────────►│                              │
     │                                       │ 1. Query Company data        │
     │                                       │ 2. Query scope totals        │
     │                                       │ 3. Query material categories │
     │                                       │ 4. Query Scope3Records       │
     │                                       │ 5. Query MethodologyNotes    │
     │                                       │ 6. Query low-confidence /    │
     │                                       │    proxy records             │
     │                                       │─────────────────────────────►│
     │                                       │◄─ all data ──────────────────│
     │                                       │                              │
     │                                       │ 7. Build ReportData object   │
     │                                       │ 8. Render report-template.tsx│
     │                                       │    via @react-pdf/renderer   │
     │                                       │ 9. renderToBuffer() → PDF    │
     │                                       │10. Create AuditTrailEvent    │
     │                                       │    action="exported"         │
     │                                       │─────────────────────────────►│
     │◄── PDF binary (application/pdf) ──────│                              │
     │  Browser triggers file download        │                              │
```

---

## Database Schema Design

Full Prisma schema stored at `src/prisma/schema.prisma`.

```
┌──────────────────────────────────────────────────────────────────────┐
│ Company                                                              │
│  id (PK, uuid)  name  country  reportingYear  orgBoundary           │
└──────────────────────┬───────────────────────────────────────────────┘
                       │ companyId FK (all entities)
         ┌─────────────┼──────────────────────┬────────────────┐
         ▼             ▼                      ▼                ▼
   ┌──────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐
   │ Supplier │  │ Scope1Record │  │ Scope2Record │  │ MethodologyNote│
   │          │  │              │  │              │  │                │
   │ id       │  │ id           │  │ id           │  │ id             │
   │ companyId│  │ companyId    │  │ companyId    │  │ companyId      │
   │ name     │  │ periodYear   │  │ periodYear   │  │ scope (enum)   │
   │ country  │  │ valueTco2e   │  │ valueTco2e   │  │ text           │
   │ sector   │  │ calcMethod   │  │ calcMethod   │  │ updatedAt      │
   │ email    │  │ efSource     │  │ efSource     │  │ [UNIQUE:       │
   │ token    │  │ dataSource   │  │ dataSource   │  │  companyId+    │
   │ status   │  │ assumptions? │  │ assumptions? │  │  scope]        │
   └────┬─────┘  │ createdAt    │  │ createdAt    │  └────────────────┘
        │        └──────────────┘  └──────────────┘
        │ supplierId FK (optional)
        ▼
   ┌─────────────────────────────────────────────┐
   │ Scope3Record                                │
   │                                             │
   │ id · companyId · supplierId? · categoryId   │
   │ periodYear · valueTco2e                     │
   │ calculationMethod (enum)                    │
   │ emissionFactorSource · dataSource (enum)    │
   │ assumptions? · confidence (Float 0-1)       │
   │ activityDataJson? (Json)                    │
   │ createdAt · updatedAt                       │
   └──────────────────────┬──────────────────────┘
                          │ categoryId FK
                          ▼
                ┌──────────────────┐
                │ Scope3Category   │
                │                  │
                │ id               │
                │ code (C1–C15)    │
                │ name             │
                │ material (bool)  │
                │ materialityReason│
                └──────────────────┘

   ┌──────────────────────────────────────────────┐
   │ AuditTrailEvent                              │
   │                                              │
   │ id · companyId · entityType (enum)           │
   │ entityId · action (enum) · actor (string)    │
   │ timestamp · comment?                         │
   └──────────────────────────────────────────────┘
```

### Schema Notes

- **Primary keys**: `String @id @default(uuid())` for all models
- **SQLite compatibility**: Prisma enums map to `TEXT` in SQLite, `ENUM` in Postgres — fully migratable
- **`activityDataJson`**: Use Prisma `Json?` type — maps to `TEXT` (SQLite) and `JSONB` (Postgres)
- **`MethodologyNote` uniqueness**: `@@unique([companyId, scope])` prevents duplicate scope notes
- **`Scope3Category` seeding**: All 15 ESRS categories pre-seeded with `code` as a unique string index
- **`DEMO_COMPANY_ID`**: Fixed string `"demo-company-001"` used as the Company PK; seeded at startup

---

## Key Technical Decisions

Documented in full detail in the referenced ADR files.

| Decision | Choice | ADR |
|----------|--------|-----|
| PDF generation library | `@react-pdf/renderer` | [ADR-001](../../adr-001-pdf-generation.md) |
| Demo seed data strategy | Rich seed (company + categories + sample records) | [ADR-002](../../adr-002-demo-seed-data.md) |
| Proxy factor configuration | Constants in `src/lib/constants.ts` | [ADR-003](../../adr-003-proxy-factor.md) |
| App Router route structure | Route groups `(app)` and `(public)` | [ADR-004](../../adr-004-app-router-structure.md) |

### Additional Design Decisions

#### Server vs Client Components

- **Server components by default**: `dashboard/page.tsx` fetches data server-side and passes props; no loading state needed for initial render.
- **Client components** only where browser APIs are required: clipboard (`SupplierTokenActions`), form state, optimistic updates (`SupplierTable`, all record forms, `ExportButton`).
- **Pattern**: Server page component fetches initial data → passes as props to client component. Client component manages mutations via `fetch()` to route handlers.

#### Prisma Client Singleton

`src/lib/prisma.ts` exports a singleton using the Next.js recommended pattern (global variable in dev to avoid hot-reload connection leaks):

```
globalThis.__prisma ??= new PrismaClient()
export const prisma = globalThis.__prisma
```

#### Audit Trail Helper

`src/lib/audit.ts` exports a single `createAuditEvent(prisma, event)` helper called from within every route handler write operation. Keeps audit logic DRY.

#### DEMO_COMPANY_ID Strategy

`DEMO_COMPANY_ID = "demo-company-001"` is exported from `src/lib/constants.ts`. All route handlers filter by this fixed ID. Avoids a database round-trip to look up the company on every request.

#### Error Handling Pattern

Route handlers return structured JSON errors:
```
{ error: string, details?: unknown }
```
With appropriate HTTP status codes (400 for validation, 404 for not found, 500 for internal). Client components display inline error messages or toasts.

#### Token Security

`publicFormToken` is generated with `crypto.randomUUID()` (Node.js built-in). UUID v4 provides 122 bits of entropy — sufficient for demo-scale anti-enumeration.

#### Reporting Year

`Company.reportingYear` is set in the seed script. Can be overridden at seed time via environment variable `REPORTING_YEAR` (defaults to `2024`). Not editable in the MVP UI.

#### `next build` Compatibility

- No dynamic server usage in static route segments
- All data-fetching pages are dynamic (explicitly `export const dynamic = "force-dynamic"`) or use route handlers (inherently dynamic)
- PDF generation happens only in the route handler, never at build time

---

## Components Affected (Implementation Scope)

This is a greenfield implementation. All files in `src/` are new. Key implementation units:

1. **Prisma schema + seed** (`src/prisma/schema.prisma`, `src/prisma/seed.ts`)
2. **Constants and lib** (`src/lib/constants.ts`, `src/lib/prisma.ts`, `src/lib/audit.ts`, `src/lib/utils.ts`)
3. **PDF generation** (`src/lib/pdf/generate-report.ts`, `src/lib/pdf/report-template.tsx`)
4. **API route handlers** (18 route handler files, see API design above)
5. **UI components** (`src/components/` — ~25 component files)
6. **App pages** (`src/app/(app)/**`, `src/app/(public)/**` — 8 page files + 2 layout files)
7. **Configuration** (`package.json`, `next.config.mjs`, `tsconfig.json`, `tailwind.config.ts`, `.env.example`, `Dockerfile`)
