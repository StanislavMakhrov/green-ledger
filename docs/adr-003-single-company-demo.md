# ADR-003: Single Demo Company Pattern

## Status

Accepted

## Context

This application is scoped to a single-company local demo for the MVP. There is no authentication, no user accounts, and no multi-tenancy. Every page, API route, and database record belongs to the same company.

The domain model includes a `Company` entity (id, name, reportingYear, orgBoundary, country) that acts as the root of all data (Suppliers, Scope 1/2/3 records, MethodologyNotes, AuditTrailEvents all carry a `companyId` foreign key). The question is how to resolve which company to use at runtime without a session or auth context.

The design must satisfy two goals simultaneously:

1. **MVP simplicity** — no login, no company selector, no session management; the app "just works" for the demo.
2. **Future extensibility** — the schema and code should not make it structurally impossible to add multi-tenancy later (e.g., when real users, billing, and RBAC are introduced).

## Decision

Adopt a **hardcoded `DEMO_COMPANY_ID` constant** pattern:

- A single `Company` record is seeded into the database by `prisma/seed.ts` with a fixed UUID.
- The constant `DEMO_COMPANY_ID` is exported from `src/lib/constants.ts` and equals that UUID.
- Every API Route Handler and server-side data function that needs to scope data to the company uses `DEMO_COMPANY_ID` directly (no session lookup, no `req.user.companyId`).
- The constant is not exposed to the client; it is used exclusively in server components and Route Handlers.

```typescript
// src/lib/constants.ts
export const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000001";
export const PROXY_FACTOR = 0.00042; // kgCO₂e per EUR — placeholder for demo
```

The seed script creates the company record with this exact ID during `prisma db seed`.

## Rationale

Using a hardcoded constant rather than a database lookup on every request is the simplest approach that satisfies MVP requirements:

- **Zero latency overhead** — no additional database query to resolve the active company on every request.
- **No session dependency** — the entire auth layer can be added later without changing existing data queries; only the `DEMO_COMPANY_ID` reference in Route Handlers needs to be replaced with `session.user.companyId`.
- **Explicit and searchable** — grepping for `DEMO_COMPANY_ID` instantly shows every place in the codebase that will need to change when multi-tenancy is added. This makes future migration straightforward.
- **Schema remains multi-tenancy-ready** — all records carry `companyId` FKs. The database schema is identical to what a production multi-tenant system would use. No schema migration is needed when adding real auth.

## Alternatives Considered

### Alternative A: Lookup the "first company" dynamically

Query `prisma.company.findFirst()` in a shared utility and cache the result. Every data access function calls this utility.

**Pros:** No hardcoded UUID in the codebase.  
**Cons:** Adds an unnecessary async lookup (even if cached, the first call has latency and error handling). The "first company" heuristic is fragile — if the seed produces more than one company record, the behaviour is non-deterministic. No clearer signal for future developers about where to add auth than `DEMO_COMPANY_ID`.

**Rejected** in favour of the explicit constant.

### Alternative B: Store DEMO_COMPANY_ID in an environment variable

Move the UUID to `.env` as `NEXT_PUBLIC_DEMO_COMPANY_ID` or `DEMO_COMPANY_ID`.

**Pros:** Slightly more configurable without code changes.  
**Cons:** Environment variables add deployment configuration overhead with no real benefit for a fixed demo scenario. The seed script still needs to create a record with the matching UUID. A constant in `constants.ts` is simpler, type-safe, and version-controlled alongside the schema.

**Rejected** in favour of a code constant for simplicity.

### Alternative C: Implement minimal session/auth from the start

Add NextAuth.js or a cookie-based session from day one, even for a single demo user.

**Pros:** Closer to production architecture; provides a natural `session.user.companyId` pattern from the start.  
**Cons:** Significantly increases MVP scope and complexity. Authentication is explicitly listed as out of scope for the MVP. Demo flows would require login steps that complicate the 5-minute demo scenario.

**Rejected** as out of scope for the MVP.

## Consequences

### Positive

- No authentication or session infrastructure needed — the app works immediately after seeding.
- All data-access code is simple and synchronous with respect to company resolution.
- Multi-tenancy migration is well-signposted: replace `DEMO_COMPANY_ID` references with `session.user.companyId` in Route Handlers.
- The `companyId` FK on every record ensures data is correctly scoped and future queries can filter by company without schema changes.

### Negative

- The hardcoded UUID is a "magic constant" that must be documented so future developers understand its purpose.
- If a developer seeds a second company record and accidentally uses its ID, data will not appear on the dashboard. This must be guarded against in the seed script (upsert with known UUID rather than insert).
- The pattern does not scale to multiple companies; this is intentional and acknowledged as a demo limitation.
