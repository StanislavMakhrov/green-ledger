# ADR-004: Seed Data Strategy, Company Setup, and Scope 3 Category Initialisation

## Status

Accepted

## Context

The MVP requires three related initialisation decisions:

1. **Seed data strategy**: Should demo data (Company, Suppliers, Scope 1/2/3 records) be
   loaded automatically on first run or via an explicit `npm run seed` command?

2. **Company setup**: Should the application have an onboarding/settings page to configure
   the Company name and reporting year, or should Company be pre-seeded only?

3. **Scope 3 category initialisation**: The 15 GHG Protocol Scope 3 categories (C1–C15) must
   exist in the database. Should they be created via a Prisma seed script or embedded in a
   migration as static SQL?

## Decisions

### Decision 1 — Seed Data Strategy

Use an **explicit `npm run seed` command** (invokes `prisma db seed` / `ts-node prisma/seed.ts`)
with a **guard that skips seeding if data already exists** (idempotent seed).

The seed script creates:

- One `Company` row (name, country, reportingYear, orgBoundary)
- Three demo `Supplier` rows with pre-generated `publicFormToken` values
- Sample `Scope1Record` and `Scope2Record` rows
- Several `Scope3Record` rows (mix of `supplier_form`, `proxy`, and `activity_based`)
- Default `MethodologyNote` rows for all three scopes
- All 15 `Scope3Category` rows (C1–C15)

The `docker-compose.yml` entrypoint runs `prisma migrate deploy && npm run seed && npm start`
so that `docker compose up` automatically seeds the database on first run.
For local development, developers run `npm run seed` once after `prisma migrate dev`.

### Decision 2 — Company Setup

**No onboarding UI for the MVP**. The Company record is created by the seed script. A
future "Company Settings" page is out of scope for the MVP demo.

### Decision 3 — Scope 3 Category Initialisation

The 15 Scope 3 categories are seeded via the **Prisma seed script** (`prisma/seed.ts`),
not embedded in a migration file.

## Rationale

**Explicit `npm run seed` with idempotency guard:**

- Auto-seeding on every startup (without a guard) risks overwriting user-entered data or
  duplicating records on container restart. This would break the demo.

- A pure "explicit only" approach (no Docker entrypoint integration) means a fresh `docker
  compose up` starts with an empty database, which defeats the 5-minute demo goal.

- The chosen approach combines both: `docker compose up` auto-seeds on first run (via the
  entrypoint command), while the idempotency guard prevents re-seeding on restart.
  Developers can also force a re-seed by dropping the database and re-running `npm run seed`.

**Pre-seeded Company only (no onboarding UI):**

- The MVP is a demo tool, not a multi-tenant SaaS product. A setup wizard adds UI scope and
  complexity without adding demo value.

- Hardcoded seed values (e.g., "Acme GmbH", reportingYear 2024) are sufficient for a
  5-minute demo. The sustainability manager persona does not need to configure this during
  the demo.

- Future versions can add a Company settings page if needed.

**Categories in seed, not in migration:**

- Embedding `INSERT` statements in a migration file ties static reference data to the schema
  migration history, making it harder to update category names or add new categories later
  without creating a new migration.

- A seed script is the correct Prisma-idiomatic place for reference data that must exist in
  every environment.

- The seed script uses `upsert` on `code` (e.g., "C1") to remain idempotent.

## Consequences

**Positive:**

- `docker compose up` provides a fully populated, demo-ready environment in one command.
- Idempotent seed means container restarts do not corrupt data.
- Scope 3 categories can be updated (names, materiality defaults) by editing the seed script
  without touching migration history.

- No onboarding complexity — demos start immediately at the dashboard with real-looking data.

**Negative:**

- The Company record cannot be changed via the UI. If a user wants a different company name
  or reporting year, they must re-seed (drop DB + `npm run seed`) or directly edit via
  `prisma studio`.

- Route handlers must defensively handle `Company not found` (return HTTP 503) in case the
  seed has not been run, even though this should not happen in normal operation.

- If the Scope 3 category list ever needs updating in production, it requires a new seed run
  (or a migration), not a UI action.

## Implementation Notes

- `src/prisma/seed.ts`: Use `prisma.scope3Category.upsert({ where: { code: 'C1' }, ... })`
  for all 15 categories to ensure idempotency. Similarly, use `findFirst()` to check if a
  Company already exists before creating one.

- Add `"prisma": { "seed": "ts-node prisma/seed.ts" }` to `src/package.json` to enable
  `npx prisma db seed`.

- Add `"seed": "prisma db seed"` to the `scripts` block in `src/package.json`.
- Docker entrypoint command: `sh -c "npx prisma migrate deploy && npm run seed && node server.js"`
  (or equivalent Next.js production start command).

- The 15 GHG Protocol Scope 3 categories are:
  - C1: Purchased Goods & Services
  - C2: Capital Goods
  - C3: Fuel- and Energy-Related Activities
  - C4: Upstream Transportation & Distribution
  - C5: Waste Generated in Operations
  - C6: Business Travel
  - C7: Employee Commuting
  - C8: Upstream Leased Assets
  - C9: Downstream Transportation & Distribution
  - C10: Processing of Sold Products
  - C11: Use of Sold Products
  - C12: End-of-Life Treatment of Sold Products
  - C13: Downstream Leased Assets
  - C14: Franchises
  - C15: Investments
