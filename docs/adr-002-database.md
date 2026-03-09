# ADR-002: Database — SQLite via Prisma with Postgres-Migratable Schema

## Status

Accepted

## Context

GreenLedger is a demo/MVP application intended to run locally via `docker compose` or
`make dev`. There is no hosted deployment in scope. The tech stack mandates:

> *"Database: SQLite via Prisma (schema must be Postgres-migratable)"*

This decision documents the rationale for SQLite as the MVP database engine, the Prisma ORM
as the data-access layer, and the schema conventions required to preserve a migration path to
PostgreSQL for a future production deployment.

## Options Considered

### Option A: SQLite via Prisma (Recommended)

Use SQLite as the embedded database engine. All application code accesses the database through
Prisma Client. The Prisma schema uses only types and features supported by both SQLite and
PostgreSQL.

**Pros:**
- Zero external services — database is a single file on disk; `docker compose` stays simple
- Prisma supports SQLite natively; migrations work identically to Postgres in development
- No connection pooling or network configuration required
- Developer setup is instant (`prisma migrate dev`)

**Cons:**
- Not suitable for multi-process concurrent writes at production scale
- `Json` type is stored as `TEXT` in SQLite (Prisma serialises/deserialises transparently)

### Option B: PostgreSQL via Docker

Run a PostgreSQL container alongside the Next.js app in `docker compose`.

**Pros:**
- Production-identical schema with no migration effort
- Full `Json` / `jsonb` support at the database level

**Cons:**
- Adds a second Docker container and startup dependency
- Overkill for a single-user local demo
- Slower developer onboarding

### Option C: In-Memory SQLite (no file persistence)

Use SQLite with an in-memory database (`:memory:`).

**Pros:**
- No disk I/O

**Cons:**
- Data is lost on every restart — unusable for a demo that seeds data
- Incompatible with Prisma's migration system

## Decision

**Use SQLite via Prisma (Option A).**

## Rationale

The MVP is a local demo. SQLite eliminates infrastructure complexity while Prisma's
abstraction layer ensures the schema remains identical to what would run on PostgreSQL in
production. Switching the data source from SQLite to PostgreSQL requires only a one-line
change in `schema.prisma` (`provider = "sqlite"` → `"postgresql"`) and re-running
`prisma migrate deploy`, provided the schema constraints below are followed.

## Consequences

### Positive

- `docker compose up` requires only a single container (Next.js app)
- Prisma Client provides type-safe database access with zero raw SQL
- Schema is the single source of truth; TypeScript types are auto-generated

### Negative

- `Json` fields are serialised as TEXT in SQLite; care required when querying with raw filters
  (not applicable in MVP as all JSON access is via Prisma)
- Concurrent write throughput is limited (not a concern for single-user demo)

## Implementation Notes

### Schema portability constraints

To maintain Postgres-migratable schema, the following rules **must** be followed:

| Rule | Rationale |
|------|-----------|
| Use `String @id @default(uuid())` for primary keys | UUID PKs work on both engines |
| Use `Json?` for `activityDataJson` | Prisma maps `Json` to TEXT on SQLite and `jsonb` on PostgreSQL; serialisation/deserialisation is handled transparently. Never store JSON as a raw `String` with manual `JSON.parse` / `JSON.stringify`. |
| Use `DateTime @default(now())` and `DateTime @updatedAt` | Supported identically on both |
| Do **not** use `@db.Text`, `@db.VarChar`, or other SQLite-specific `@db` attributes | SQLite ignores them; Postgres needs the correct native type |
| Do **not** use `AUTOINCREMENT` integer PKs | UUID strings are portable; autoincrement sequences differ between engines |
| Enum values: define as Prisma `enum` blocks | Prisma maps to CHECK constraints on SQLite and native enums on Postgres |

### File locations

```
src/prisma/
  schema.prisma      # Prisma schema (datasource, generator, all models)
  migrations/        # Auto-generated migration files (committed to git)
  seed.ts            # Prisma seed script (ts-node / tsx)
src/lib/
  prisma.ts          # Singleton Prisma Client (prevents hot-reload connection leaks)
```

### Prisma Client singleton pattern

```ts
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

This prevents Next.js hot-reload from exhausting the SQLite connection on every file change.

### Environment variables

```
DATABASE_URL="file:./dev.db"   # default for local dev and Docker
```

The Docker image mounts a volume at the database path so data survives container restarts.

### Prisma schema datasource block

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

Switching to Postgres: change `provider = "postgresql"` and update `DATABASE_URL`.
