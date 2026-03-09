# Architecture: GreenLedger MVP

## Status

Accepted

## Overview

GreenLedger MVP is a single Next.js (App Router) full-stack application. The frontend renders
server components for all internal pages and calls Next.js Route Handlers (acting as the JSON
API). SQLite is accessed exclusively through Prisma. PDF export is performed server-side by
rendering an HTML template and converting it to PDF with Puppeteer.

See individual ADRs for each major technical decision:

| ADR | Decision |
|-----|----------|
| [ADR-001](../../adr-001-nextjs-app-router.md) | Next.js App Router with server components |
| [ADR-002](../../adr-002-prisma-sqlite.md) | Prisma + SQLite (Postgres-migratable) |
| [ADR-003](../../adr-003-pdf-rendering.md) | Puppeteer for PDF rendering |
| [ADR-004](../../adr-004-seed-strategy.md) | Explicit `npm run seed` with auto-seed guard |
| [ADR-005](../../adr-005-proxy-factor.md) | PROXY_FACTOR = 0.4 kgCO₂e/€ named constant |

---

## High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│  Browser                                                            │
│  ┌──────────────┐   ┌─────────────────────────────────────────┐    │
│  │ Internal UI  │   │  Public Supplier Form                   │    │
│  │ (App Router  │   │  /public/supplier/[token]               │    │
│  │  pages)      │   │  (no nav, no auth)                      │    │
│  └──────┬───────┘   └──────────────┬──────────────────────────┘    │
└─────────┼──────────────────────────┼─────────────────────────────-─┘
          │ Server Components /       │ POST form submit
          │ Client fetch()            │
┌─────────▼──────────────────────────▼──────────────────────────────-┐
│  Next.js App Router (Node.js server)                                │
│                                                                     │
│  ┌─────────────────────────┐  ┌──────────────────────────────────┐ │
│  │  Page Components        │  │  Route Handlers (app/api/**)     │ │
│  │  (server components     │  │  - dashboard                     │ │
│  │   by default)           │  │  - suppliers / [id] / token      │ │
│  │                         │  │  - scope1 / scope2               │ │
│  │  Client components      │  │  - scope3/categories / records   │ │
│  │  ("use client") only    │  │  - methodology / [scope]         │ │
│  │  for interactive forms  │  │  - export/pdf                    │ │
│  │  and copy-to-clipboard  │  │  - public/supplier/[token]       │ │
│  └──────────────┬──────────┘  └──────────────┬───────────────────┘ │
│                 │                             │                     │
│  ┌──────────────▼─────────────────────────────▼───────────────────┐│
│  │  src/lib/                                                       ││
│  │  - prisma.ts     (Prisma client singleton)                      ││
│  │  - constants.ts  (PROXY_FACTOR, etc.)                           ││
│  │  - emissions.ts  (KPI aggregation, proxy calculation)           ││
│  │  - pdf.ts        (HTML template + Puppeteer PDF generation)     ││
│  │  - audit.ts      (AuditTrailEvent creation helper)              ││
│  └──────────────────────────────┬──────────────────────────────────┘│
└─────────────────────────────────┼───────────────────────────────────┘
                                  │ Prisma ORM
                          ┌───────▼────────┐
                          │  SQLite DB     │
                          │  (prisma.db)   │
                          └────────────────┘
```

---

## `src/` Directory Structure

```
src/
├── package.json
├── Dockerfile
├── next.config.mjs
├── tsconfig.json
├── eslint.config.mjs
├── vitest.config.ts
│
├── app/
│   ├── layout.tsx                    # Root layout: persistent sidebar nav
│   ├── page.tsx                      # Redirect → /dashboard
│   │
│   ├── dashboard/
│   │   └── page.tsx                  # KPI cards (server component)
│   │
│   ├── suppliers/
│   │   └── page.tsx                  # Supplier CRUD + token management
│   │
│   ├── scope-1/
│   │   └── page.tsx                  # Add + list Scope 1 records
│   │
│   ├── scope-2/
│   │   └── page.tsx                  # Add + list Scope 2 records
│   │
│   ├── scope-3/
│   │   └── page.tsx                  # Categories + records
│   │
│   ├── methodology/
│   │   └── page.tsx                  # Edit methodology notes
│   │
│   ├── export/
│   │   └── page.tsx                  # PDF download trigger
│   │
│   ├── public/
│   │   └── supplier/
│   │       └── [token]/
│   │           └── page.tsx          # Public supplier form (no nav)
│   │
│   └── api/
│       ├── dashboard/
│       │   └── route.ts
│       ├── suppliers/
│       │   ├── route.ts              # GET list, POST create
│       │   └── [id]/
│       │       ├── route.ts          # PUT update, DELETE
│       │       └── token/
│       │           └── route.ts      # POST generate/refresh token
│       ├── scope1/
│       │   ├── route.ts              # GET list, POST create
│       │   └── [id]/
│       │       └── route.ts          # DELETE
│       ├── scope2/
│       │   ├── route.ts
│       │   └── [id]/
│       │       └── route.ts
│       ├── scope3/
│       │   ├── categories/
│       │   │   ├── route.ts          # GET list
│       │   │   └── [id]/
│       │   │       └── route.ts      # PUT update materiality
│       │   └── records/
│       │       ├── route.ts          # GET list
│       │       └── [id]/
│       │           └── route.ts      # DELETE
│       ├── methodology/
│       │   ├── route.ts              # GET all notes
│       │   └── [scope]/
│       │       └── route.ts          # PUT upsert note
│       ├── export/
│       │   └── pdf/
│       │       └── route.ts          # POST → PDF binary
│       └── public/
│           └── supplier/
│               └── [token]/
│                   ├── route.ts      # GET supplier info
│                   └── submit/
│                       └── route.ts  # POST form submission
│
├── lib/
│   ├── prisma.ts                     # PrismaClient singleton (module-level cache)
│   ├── constants.ts                  # PROXY_FACTOR, PROXY_FACTOR_SOURCE
│   ├── emissions.ts                  # KPI aggregation, proxy tCO₂e calculation
│   ├── pdf.ts                        # HTML template builder + Puppeteer PDF conversion
│   └── audit.ts                      # createAuditEvent() helper
│
├── prisma/
│   ├── schema.prisma                 # Prisma schema (SQLite datasource)
│   ├── seed.ts                       # Demo seed: Company, Suppliers, S1/S2/S3 records, Categories
│   └── migrations/                   # Prisma migrate history
│
└── public/
    └── (static assets, e.g. logo)
```

---

## Database Schema Overview

All tables use UUID primary keys (`String @id @default(uuid())`). Enums are represented as
`String` fields with Prisma `@map` or documented constraints to remain SQLite-compatible while
being semantically equivalent to Postgres `ENUM` types.

### Tables and Key Relationships

```
Company ──< Supplier
        ──< Scope1Record
        ──< Scope2Record
        ──< Scope3Record
        ──< MethodologyNote
        ──< AuditTrailEvent

Scope3Category ──< Scope3Record
Supplier       ──< Scope3Record (optional/nullable)
```

### Key Schema Notes

- **Company** is the root aggregate; the MVP assumes exactly one Company row in the database.
  The seed script creates it; the application reads the first (and only) Company for all queries.
- **Scope3Category** rows are seeded once (C1–C15 per GHG Protocol). They are static reference
  data and are never created via the application UI.
- **AuditTrailEvent** is append-only. No `UPDATE` or `DELETE` operations are performed on it.
- **publicFormToken** on `Supplier` is a `String @unique` generated with `crypto.randomUUID()`
  server-side.
- **activityDataJson** on `Scope3Record` stores raw submitted form fields as JSON; Prisma
  `Json` type maps to `TEXT` in SQLite.

---

## API Route Design Principles

1. **Route Handlers only** — All API logic lives in `app/api/**/route.ts` files. No custom
   Express/Hono server.

2. **Single-company shortcut** — All API handlers fetch the singleton Company with
   `prisma.company.findFirst()`. No `companyId` is passed from the client; it is always
   resolved server-side.

3. **Lean handlers, logic in `lib/`** — Route handlers parse the request, delegate to helpers
   in `src/lib/` for business logic (calculations, PDF assembly, audit creation), and return
   the response. This keeps handlers short and testable.

4. **Consistent response shape**:
   - Success: `{ data: ... }` with HTTP 200/201
   - Validation error: `{ error: "message" }` with HTTP 400
   - Not found: `{ error: "Not found" }` with HTTP 404
   - Server error: `{ error: "Internal server error" }` with HTTP 500

5. **No authentication** — MVP has no auth. All routes are open. The public supplier form is
   access-controlled only by the unpredictable `publicFormToken`.

6. **PDF export route** — `POST /api/export/pdf` assembles report data, renders HTML, converts
   to PDF with Puppeteer, and returns `application/pdf` binary. It also creates an
   `AuditTrailEvent` for the export action.

---

## Key Design Decisions Summary

| Question | Decision | ADR |
|----------|----------|-----|
| Next.js routing approach | App Router; server components by default | ADR-001 |
| Database | SQLite via Prisma; schema authored for Postgres migration | ADR-002 |
| PDF rendering | Puppeteer (headless Chromium) | ADR-003 |
| Seed/demo data | Explicit `npm run seed`; auto-seed guard on startup | ADR-004 |
| PROXY_FACTOR | 0.4 kgCO₂e/€ named constant in `lib/constants.ts` | ADR-005 |
| Root redirect | `/` → `/dashboard` via Next.js `redirect()` | ADR-001 |
| Company setup | Pre-seeded only; no onboarding UI for MVP | ADR-004 |
| Scope 3 categories | Seeded in `prisma/seed.ts`, not in migration | ADR-004 |
| Single-company assumption | `findFirst()` pattern; no multi-tenancy | ADR-002 |
