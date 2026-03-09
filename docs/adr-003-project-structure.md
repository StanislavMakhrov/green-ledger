# ADR-003: Project Structure — Mono-Repo Next.js App under `src/`

## Status

Accepted

## Context

GreenLedger is a full-stack application serving both the UI (React pages) and the API
(Route Handlers) from a single Next.js instance. The project spec mandates:

> *"All application source code lives in the `src/` directory, including `package.json`,
> `Dockerfile`, Next.js config, Prisma schema, TypeScript source, etc."*
>
> *"The repo root contains only project-level files: `README.md`, `LICENSE`,
> `CONTRIBUTING.md`, `CHANGELOG.md`, and directories `docs/`, `scripts/`, `.github/`"*

This decision documents the directory layout inside `src/`, the organisation of Next.js App
Router pages and API routes, and the conventions for shared library code.

## Decision

Organise all application code under `src/` following Next.js App Router conventions with
the layout documented below.

## Rationale

Separating the application source from repo-level concerns (docs, CI config, scripts) keeps
the `src/` directory self-contained and deployable as a standalone unit (Docker build context
is `src/`). The App Router convention with co-located `page.tsx` / `route.ts` files provides
a clear mapping from URL paths to source files, making the codebase easy to navigate.

Shared logic (Prisma client, constants, utilities, PDF generation) lives in `src/lib/` and
`src/components/` to avoid duplication and keep page/route files focused on their specific
concerns.

## Directory Layout

```
src/
├── package.json                   # npm package definition (name: "green-ledger")
├── Dockerfile                     # Docker image build (build context: src/)
├── next.config.mjs                # Next.js configuration
├── tsconfig.json                  # TypeScript (strict mode)
├── eslint.config.mjs              # ESLint with Next.js recommended + Prettier
├── tailwind.config.ts             # TailwindCSS configuration
├── postcss.config.mjs             # PostCSS (required by Tailwind)
├── vitest.config.ts               # Vitest test configuration
│
├── app/                           # Next.js App Router root
│   ├── layout.tsx                 # Root layout (HTML shell + navigation sidebar)
│   ├── page.tsx                   # Root page → redirect to /dashboard
│   ├── globals.css                # Tailwind base styles
│   │
│   ├── dashboard/
│   │   └── page.tsx               # KPI cards: Scope 1, 2, 3, Total
│   │
│   ├── suppliers/
│   │   └── page.tsx               # Supplier CRUD + token generation/copy
│   │
│   ├── scope-1/
│   │   └── page.tsx               # Scope 1 records: list + add form
│   │
│   ├── scope-2/
│   │   └── page.tsx               # Scope 2 records: list + add form
│   │
│   ├── scope-3/
│   │   └── page.tsx               # Scope 3 categories panel + records panel
│   │
│   ├── methodology/
│   │   └── page.tsx               # Per-scope methodology note editor
│   │
│   ├── export/
│   │   └── page.tsx               # PDF download trigger page
│   │
│   ├── public/
│   │   └── supplier/
│   │       └── [token]/
│   │           └── page.tsx       # Public supplier form (unauthenticated)
│   │
│   └── api/                       # Next.js Route Handlers
│       ├── dashboard/
│       │   └── route.ts           # GET  — scope totals
│       │
│       ├── suppliers/
│       │   ├── route.ts           # GET list, POST create
│       │   └── [id]/
│       │       ├── route.ts       # GET one, PUT update, DELETE (status=inactive)
│       │       └── token/
│       │           └── route.ts   # POST — refresh publicFormToken
│       │
│       ├── scope1/
│       │   ├── route.ts           # GET list, POST create
│       │   └── [id]/
│       │       └── route.ts       # DELETE
│       │
│       ├── scope2/
│       │   ├── route.ts           # GET list, POST create
│       │   └── [id]/
│       │       └── route.ts       # DELETE
│       │
│       ├── scope3/
│       │   ├── categories/
│       │   │   ├── route.ts       # GET all categories
│       │   │   └── [id]/
│       │   │       └── route.ts   # PUT — update material/materialityReason
│       │   └── records/
│       │       ├── route.ts       # GET list, POST create
│       │       └── [id]/
│       │           └── route.ts   # DELETE
│       │
│       ├── methodology/
│       │   └── route.ts           # GET all notes, PUT upsert per scope
│       │
│       ├── export/
│       │   └── pdf/
│       │       └── route.ts       # GET — generate and stream PDF
│       │
│       └── supplier-form/
│           └── [token]/
│               └── route.ts       # GET supplier info, POST submit form
│
├── components/                    # Reusable React components
│   ├── layout/
│   │   ├── Sidebar.tsx            # Navigation sidebar
│   │   └── PageHeader.tsx         # Page title + breadcrumb
│   └── ui/
│       ├── KpiCard.tsx            # Dashboard KPI card widget
│       ├── DataTable.tsx          # Generic sortable data table
│       ├── FormModal.tsx          # Generic modal with form
│       └── StatusBadge.tsx        # Coloured status pill
│
├── lib/                           # Shared application logic
│   ├── prisma.ts                  # Prisma Client singleton
│   ├── constants.ts               # PROXY_FACTOR and other config constants
│   ├── calculations.ts            # Proxy calculation logic
│   ├── audit.ts                   # Helper to create AuditTrailEvent records
│   └── pdf/
│       ├── components.tsx         # @react-pdf/renderer report components
│       └── generate.ts            # generateReport(data): Promise<Buffer>
│
├── prisma/
│   ├── schema.prisma              # Prisma schema (models, enums, datasource)
│   ├── migrations/                # Prisma migration history (committed)
│   └── seed.ts                    # Seed script (demo company, categories, data)
│
└── public/                        # Next.js static assets
    └── favicon.ico
```

## Key Conventions

### Pages vs. Route Handlers

- **Pages** (`app/**/page.tsx`) render UI using React Server Components by default.
  Add `"use client"` only when browser APIs or event handlers are needed.
- **Route Handlers** (`app/api/**/route.ts`) implement REST-style API endpoints using
  Next.js `NextRequest` / `NextResponse`.
- Pages fetch their own data directly via Prisma (server component data fetching) **or**
  call the API routes from client components. For MVP, direct Prisma access in server
  components is preferred for simplicity; API routes are used by client-side interactions
  (form submissions, mutations).

### Naming conventions

| Artefact | Convention | Example |
|----------|-----------|---------|
| Page files | `page.tsx` | `app/dashboard/page.tsx` |
| Route handlers | `route.ts` | `app/api/suppliers/route.ts` |
| React components | PascalCase `.tsx` | `KpiCard.tsx` |
| Library modules | camelCase `.ts` | `calculations.ts` |
| Prisma schema | `schema.prisma` | (single file) |

### Client vs. Server components

- Default to **Server Components** (no directive needed)
- Add `"use client"` only for:
  - Components with `useState`, `useEffect`, or other React hooks
  - Components that use browser APIs (`window`, `navigator.clipboard`, etc.)
  - Event handlers that cannot be server actions

### API route response format

All Route Handlers return JSON with consistent structure:

```ts
// Success
{ data: T }

// Error
{ error: string }
```

HTTP status codes follow REST conventions: `200 OK`, `201 Created`, `400 Bad Request`,
`404 Not Found`, `500 Internal Server Error`.

## Consequences

### Positive

- Clear separation between repo-level files and application code
- URL paths map directly to file paths (Next.js App Router convention)
- Single Next.js process serves both UI and API — no separate backend service needed
- Docker build context is `src/` — clean and minimal image

### Negative

- `src/app/public/` path may cause confusion with `src/public/` (static assets); documented
  clearly in this ADR to avoid mistakes
- File count grows with App Router nesting; mitigated by keeping route handlers small and
  delegating logic to `src/lib/`
