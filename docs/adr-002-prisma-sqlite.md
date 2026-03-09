# ADR-002: Prisma + SQLite Data Layer (Postgres-Migratable)

## Status

Accepted

## Context

The spec mandates SQLite via Prisma for the MVP with the constraint that the schema must be
Postgres-migratable for a future hosted deployment. The domain model has eight entities with
relationships, enumerations, and JSON fields.

Additional design question: how to handle the single-company assumption. The MVP describes
"one demo company" — the application always operates in the context of a single `Company` row.
This needs a consistent access pattern so that route handlers don't each implement their own
company-lookup logic.

## Decision

1. Use **Prisma ORM** with the `sqlite` provider. The schema is written to be directly
   compatible with Postgres by:

   - Using `String @id @default(uuid())` for all primary keys (UUIDs, not auto-increment).
   - Avoiding SQLite-only pragmas or raw SQL.
   - Using Prisma `Json` fields (stored as `TEXT` in SQLite, native `jsonb` in Postgres).
   - Modelling enumerations as Prisma `enum` types (Prisma emits the correct DDL per database).
2. **Single-company access pattern**: All API route handlers resolve the active company via
   `prisma.company.findFirst()`. No `companyId` is ever passed from the client. This is
   safe because the MVP is a single-tenant local demo with exactly one Company row.

3. A **Prisma client singleton** is exported from `src/lib/prisma.ts` using the recommended
   Next.js pattern (module-level cache to avoid connection exhaustion in development hot-reload).

## Rationale

**Prisma** provides type-safe query building, first-class Next.js support, and a migration
system that works with both SQLite and Postgres. It satisfies the "no raw SQL" coding
standard.

**UUID primary keys** are required for Postgres compatibility. SQLite `INTEGER PRIMARY KEY`
with auto-increment is idiomatic SQLite but incompatible with distributed Postgres deployments.

**`findFirst()` for Company**: The alternative — requiring every client request to pass a
`companyId` — adds unnecessary complexity for a single-tenant demo. The pattern is explicit,
easy to replace with proper multi-tenancy in a future version, and keeps request validation
simple.

**Prisma enums**: SQLite does not have a native `ENUM` type; Prisma maps enums to `TEXT`
with a check constraint. When migrating to Postgres, Prisma generates a native `CREATE TYPE`
enum. This ensures behavioural parity without schema changes.

## Consequences

**Positive:**

- Schema changes are tracked via Prisma migrations — reproducible across environments.
- Type safety for all database operations via generated Prisma Client types.
- Switching from SQLite to Postgres for a hosted deployment requires only changing the
  `datasource` `provider` and `url` in `schema.prisma` and running `prisma migrate deploy`.

- Simple developer experience: `prisma migrate dev` / `prisma studio` work without extra setup.

**Negative:**

- SQLite does not support concurrent writes well. This is acceptable for a local demo but
  means the architecture cannot scale to multi-user without switching databases.

- `findFirst()` on Company will silently return `null` if the seed has not been run. API
  handlers must handle this case and return a 503 or helpful error message.

- Prisma `Json` fields do not have query-level type safety; runtime validation (e.g., Zod)
  is recommended when reading `activityDataJson`.

## Implementation Notes

- `src/lib/prisma.ts`: Export a global singleton `PrismaClient` using the Next.js recommended
  pattern to avoid "too many connections" in dev mode hot-reload.

- `src/prisma/schema.prisma`: Use `provider = "sqlite"` for MVP. All PKs `@default(uuid())`.
  All `DateTime` fields use `@default(now())` or `@updatedAt`.

- Route handlers that need the active company call a shared `getCompany()` helper from
  `src/lib/prisma.ts` (or inline `findFirst()`) and return HTTP 503 with a descriptive message
  if no Company row exists.

- The `AuditTrailEvent` table has no `UPDATE` or `DELETE` Prisma operations — treat it as
  append-only at the application layer.
