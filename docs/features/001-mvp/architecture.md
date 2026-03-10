# Architecture: GreenLedger MVP

## Status

Accepted

## Overview

GreenLedger MVP is a single Next.js (App Router) application providing both the full user interface and the REST API. It uses Prisma with SQLite for local demo and is packaged as a Docker container. All application code lives under `src/`.

The architecture is intentionally minimal: one process, one database, no microservices, no external queues. The complexity ceiling for the MVP is a well-structured monolith with clear module boundaries.

---

## Directory Structure

```
/                                  # Repo root
├── README.md
├── LICENSE
├── CONTRIBUTING.md
├── CHANGELOG.md
├── docs/                          # Architecture docs, ADRs, feature specs
│   ├── spec.md
│   ├── architecture.md
│   ├── adr-001-tech-stack.md
│   ├── adr-002-pdf-generation.md
│   ├── adr-003-single-company-demo.md
│   ├── adr-004-supplier-token-auth.md
│   └── features/001-mvp/
│       ├── specification.md
│       ├── architecture.md        # ← this file
│       └── work-protocol.md
├── scripts/                       # CI/CD helper scripts
└── .github/                       # GitHub Actions workflows, skills, agents

src/                               # All application source code
├── package.json
├── Dockerfile
├── next.config.mjs
├── tsconfig.json
├── eslint.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
│
├── app/                           # Next.js App Router
│   ├── layout.tsx                 # Root layout (nav, global styles)
│   ├── page.tsx                   # Root redirect → /dashboard
│   │
│   ├── dashboard/
│   │   └── page.tsx               # KPI cards (server component)
│   ├── suppliers/
│   │   └── page.tsx               # Supplier list + token management
│   ├── scope-1/
│   │   └── page.tsx               # Scope 1 add/list
│   ├── scope-2/
│   │   └── page.tsx               # Scope 2 add/list
│   ├── scope-3/
│   │   └── page.tsx               # Categories + records
│   ├── methodology/
│   │   └── page.tsx               # Methodology notes editor
│   ├── export/
│   │   └── page.tsx               # PDF export trigger
│   │
│   ├── public/
│   │   └── supplier/
│   │       └── [token]/
│   │           └── page.tsx       # Public supplier form (no auth)
│   │
│   └── api/                       # REST API (Route Handlers)
│       ├── company/
│       │   └── route.ts           # GET, PUT
│       ├── suppliers/
│       │   ├── route.ts           # GET, POST
│       │   └── [id]/
│       │       ├── route.ts       # GET, PUT, DELETE
│       │       └── token/
│       │           └── route.ts   # POST (generate/refresh token)
│       ├── scope1/
│       │   ├── route.ts           # GET, POST
│       │   └── [id]/
│       │       └── route.ts       # DELETE
│       ├── scope2/
│       │   ├── route.ts           # GET, POST
│       │   └── [id]/
│       │       └── route.ts       # DELETE
│       ├── scope3/
│       │   ├── categories/
│       │   │   ├── route.ts       # GET
│       │   │   └── [id]/
│       │   │       └── route.ts   # PUT (materiality)
│       │   └── records/
│       │       ├── route.ts       # GET, POST
│       │       └── [id]/
│       │           └── route.ts   # DELETE
│       ├── public/
│       │   └── supplier/
│       │       └── [token]/
│       │           └── route.ts   # POST (form submission, no auth)
│       ├── methodology/
│       │   ├── route.ts           # GET
│       │   └── [scope]/
│       │       └── route.ts       # PUT (upsert)
│       ├── export/
│       │   └── pdf/
│       │       └── route.ts       # GET (generate + stream PDF)
│       ├── dashboard/
│       │   └── route.ts           # GET (KPI aggregates)
│       └── audit/
│           └── route.ts           # GET (audit trail)
│
├── lib/                           # Shared server-side logic
│   ├── prisma.ts                  # Prisma singleton client
│   ├── constants.ts               # DEMO_COMPANY_ID, PROXY_FACTOR
│   ├── calculations.ts            # Proxy calculation logic
│   ├── audit.ts                   # Audit trail helper
│   └── pdf/
│       ├── generator.ts           # Puppeteer PDF generation
│       └── report-template.ts     # HTML template for CSRD report
│
├── prisma/
│   ├── schema.prisma              # Prisma schema (SQLite datasource)
│   ├── seed.ts                    # Database seed (demo company, categories)
│   └── migrations/                # Prisma migration files
│
└── public/                        # Static assets (favicon, logos)
```

---

## Key Architectural Patterns

### 1. Server Components by Default

All pages (`app/**/page.tsx`) are React Server Components unless they require browser interactivity (form state, clipboard access, client-side navigation triggers). Interactive UI elements (forms, buttons with handlers, copy-to-clipboard) are extracted into `"use client"` sub-components.

**Rule of thumb:**
- `page.tsx` — server component; fetches data directly via Prisma or via internal fetch to the API.
- `components/SomeForm.tsx` — client component when it manages local state or handles browser events.

### 2. API Route Handlers (REST)

All data mutations go through Route Handlers in `app/api/`. They follow REST conventions:

```
GET    /api/suppliers          → list
POST   /api/suppliers          → create
GET    /api/suppliers/[id]     → read one
PUT    /api/suppliers/[id]     → update
DELETE /api/suppliers/[id]     → delete
```

Route Handlers use the `NextRequest` / `NextResponse` API and return JSON. They access the database via the Prisma singleton in `src/lib/prisma.ts`.

All authenticated (internal) routes implicitly scope data to `DEMO_COMPANY_ID`. The public supplier form route (`/api/public/supplier/[token]`) uses no auth and looks up the supplier by token.

### 3. Prisma Singleton Client

Prisma instantiates a connection pool. In Next.js development mode, hot-module reloading can create multiple Prisma Client instances and exhaust the connection pool. The singleton pattern prevents this:

```typescript
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### 4. Constants and Configuration

All application constants live in `src/lib/constants.ts`. They are server-only (never `NEXT_PUBLIC_`):

```typescript
// src/lib/constants.ts

/** Fixed UUID of the single demo company. Seeded in prisma/seed.ts. */
export const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000001";

/**
 * Placeholder emission factor: kgCO₂e per EUR of spend.
 * Source: DEFRA spend-based proxy, generalised for demo purposes.
 * Replace with sector-specific factors in production.
 */
export const PROXY_FACTOR = 0.00042;

/** PROXY_FACTOR source description for audit trail storage. */
export const PROXY_FACTOR_SOURCE = "DEFRA spend-based emission factor (generalised, demo placeholder)";
```

---

## Database Access Pattern

All database access goes through Prisma. No raw SQL is used.

- **Reads:** `prisma.model.findMany(...)`, `prisma.model.findUnique(...)`, `prisma.model.aggregate(...)`
- **Writes:** `prisma.model.create(...)`, `prisma.model.update(...)`, `prisma.model.upsert(...)`, `prisma.model.delete(...)`
- **Transactions:** Use `prisma.$transaction([...])` when multiple writes must be atomic (e.g., creating a Scope3Record + AuditTrailEvent together on supplier form submission).

The SQLite datasource in `schema.prisma`:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

To migrate to Postgres, only the `provider` and `DATABASE_URL` need to change. All models and relations are Postgres-compatible (no SQLite-only features are used).

---

## API Design

### REST Conventions

- **GET** — read (no side effects)
- **POST** — create or trigger action
- **PUT** — full or partial update (idempotent for the same payload)
- **DELETE** — remove record

### Response Format

All Route Handlers return JSON:

```json
// Success (200/201)
{ "data": { ... } }

// Error (400/404/500)
{ "error": "Human-readable error message" }
```

### Validation

Input validation is performed in Route Handlers before any database write. Invalid requests return HTTP 400 with an error message. No external validation library is required for MVP; manual checks are sufficient given the small number of endpoints.

---

## PDF Generation Flow

```
GET /api/export/pdf
  │
  ├─ 1. Fetch all required data from Prisma:
  │      - Company (name, reportingYear)
  │      - Scope1Records, Scope2Records (aggregated totals)
  │      - Scope3Records (with supplier, category relations)
  │      - MethodologyNotes (all three scopes)
  │
  ├─ 2. Call src/lib/pdf/report-template.ts
  │      - Produces a self-contained HTML string
  │      - Includes inline CSS (no external CDN calls from Puppeteer context)
  │      - Sections: cover, summary table, Scope 3 breakdown,
  │        methodology, assumptions & data quality
  │
  ├─ 3. Call src/lib/pdf/generator.ts
  │      - Launches Puppeteer (headless Chromium)
  │      - Sets HTML content: page.setContent(html)
  │      - Calls page.pdf({ format: "A4", printBackground: true })
  │      - Returns Buffer
  │
  ├─ 4. Write AuditTrailEvent:
  │      { entityType: "export", action: "exported", actor: "user" }
  │
  └─ 5. Return Response with headers:
         Content-Type: application/pdf
         Content-Disposition: attachment; filename="csrd-climate-report-{year}.pdf"
```

### PDF Report Sections

| Section | Data Source |
|---------|------------|
| Cover page | `Company.name`, `Company.reportingYear` |
| Executive summary | Aggregated `Scope1Record`, `Scope2Record`, `Scope3Record` totals |
| Scope 3 breakdown | Material `Scope3Category` records with `Scope3Record` totals per category |
| Methodology | `MethodologyNote` for `scope_3`; brief notes for `scope_1`, `scope_2` |
| Assumptions & Data Quality | `Scope3Record` where `dataSource = "proxy"` OR `confidence < 1` OR `assumptions` is non-empty |

---

## Audit Trail Pattern

Every significant state change creates an `AuditTrailEvent` record. This is the immutable log of actions for auditor review.

The helper in `src/lib/audit.ts`:

```typescript
export async function logAuditEvent(params: {
  companyId: string;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  actor: string;
  comment?: string;
}): Promise<void> {
  await prisma.auditTrailEvent.create({ data: { ...params, timestamp: new Date() } });
}
```

**Events logged:**

| Trigger | entityType | action | actor |
|---------|-----------|--------|-------|
| Supplier created | `supplier` | `created` | `user` |
| Supplier updated | `supplier` | `updated` | `user` |
| Scope3Record created via form | `scope3` | `submitted` | `supplier` |
| Scope3Record created manually | `scope3` | `created` | `user` |
| PDF exported | `export` | `exported` | `user` |
| MethodologyNote updated | `methodology` | `updated` | `user` |

---

## Public Supplier Form

The supplier form is a special case: it is publicly accessible without authentication, identified only by the token in the URL.

### Page Route: `/public/supplier/[token]`

```
src/app/public/supplier/[token]/page.tsx
```

This is a Server Component that:
1. Looks up the supplier: `prisma.supplier.findUnique({ where: { publicFormToken: token } })`
2. If not found: renders a 404 / "Link expired" message.
3. If found: renders the `SupplierFormClient` client component with the supplier name.

### API Route: `POST /api/public/supplier/[token]`

```
src/app/api/public/supplier/[token]/route.ts
```

This Route Handler:
1. Looks up the supplier by `publicFormToken`.
2. Validates the submitted payload (one of `spend_eur`, `ton_km`, `waste_kg`).
3. Calculates `valueTco2e`:
   - If `spend_eur` is provided: `valueTco2e = spend_eur * PROXY_FACTOR`; `calculationMethod = "spend_based"`; `confidence = 0.5`
   - If `ton_km` is provided: uses transport proxy factor; `calculationMethod = "activity_based"`
   - If `waste_kg` is provided: uses waste proxy factor; `calculationMethod = "activity_based"`
4. Finds the default material Scope 3 category (C1 — Purchased goods & services) unless the supplier selected one.
5. Creates `Scope3Record` in a transaction with `AuditTrailEvent`.
6. Returns `{ success: true }`.

### Token Generation

```
POST /api/suppliers/[id]/token
  → crypto.randomUUID()
  → prisma.supplier.update({ where: { id }, data: { publicFormToken: newToken } })
  → Returns { token, url }
```

---

## Single Company Pattern

See [ADR-003](../../adr-003-single-company-demo.md) for full rationale.

All Route Handlers and server data functions use `DEMO_COMPANY_ID` from `src/lib/constants.ts` to scope queries. When multi-tenancy is added, `DEMO_COMPANY_ID` references in Route Handlers are replaced with `session.user.companyId`.

Example:

```typescript
// src/app/api/suppliers/route.ts
import { DEMO_COMPANY_ID } from "@/lib/constants";

export async function GET() {
  const suppliers = await prisma.supplier.findMany({
    where: { companyId: DEMO_COMPANY_ID },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ data: suppliers });
}
```

---

## Proxy Calculation Logic

See [ADR-003](../../adr-003-single-company-demo.md) and business rules in the specification.

The calculation lives in `src/lib/calculations.ts`:

```typescript
export function calculateProxyEmissions(input: {
  spend_eur?: number;
  ton_km?: number;
  waste_kg?: number;
}): {
  valueTco2e: number;
  calculationMethod: "spend_based" | "activity_based";
  assumptions: string;
  confidence: number;
  emissionFactorSource: string;
}
```

This function is called by the public form submission Route Handler and is independently unit-testable.

---

## Testing Strategy

- **Unit tests (Vitest):** Cover `src/lib/calculations.ts` (proxy logic) and key Route Handler logic (input validation, response shapes).
- **Integration smoke test:** `next build` — verifies TypeScript compiles, all pages/routes are valid, no import errors.
- **No E2E tests** for MVP (Playwright/Cypress are out of scope).

Test files live alongside source files or in a `__tests__/` subdirectory under `src/`.

---

## Components Affected

The following modules will be created or modified during implementation:

| Module | Files |
|--------|-------|
| Database schema | `src/prisma/schema.prisma`, `src/prisma/seed.ts` |
| Constants | `src/lib/constants.ts` |
| Prisma client | `src/lib/prisma.ts` |
| Proxy calculations | `src/lib/calculations.ts` |
| Audit helper | `src/lib/audit.ts` |
| PDF generator | `src/lib/pdf/generator.ts`, `src/lib/pdf/report-template.ts` |
| API routes | All files under `src/app/api/` (see directory structure) |
| UI pages | All files under `src/app/` (see directory structure) |
| Root layout + nav | `src/app/layout.tsx` |
| Docker | `src/Dockerfile` |
| Make targets | `Makefile` (repo root) |
| Tests | `src/__tests__/` or colocated `*.test.ts` files |
