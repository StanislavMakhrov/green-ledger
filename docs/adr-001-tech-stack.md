# ADR-001: Tech Stack Selection

## Status

Accepted

## Context

This is a greenfield B2B SaaS application targeting German SMEs for CSRD/ESRS climate reporting. The MVP must be delivered as a local demo that can be containerised and run via `docker compose`. The team requires a full-stack framework with a single codebase for both UI and API, a relational database with future Postgres-migration capability, strict TypeScript enforcement, and a test harness that integrates with CI.

The following concerns drive the stack selection:

- **Single repo, single app** — minimise operational complexity for an MVP.
- **TypeScript strict mode** — prevent runtime errors and support auditor-grade code quality.
- **Server-side rendering** — pages must be crawlable, and data-heavy pages (dashboard, export) benefit from server components to avoid client/server data duplication.
- **SQLite for local demo** — zero external database dependency during development; must be migrated to Postgres without schema changes for a future production deployment.
- **Minimal testing overhead** — Vitest for unit/smoke tests; `next build` acts as the integration smoke test in CI.

## Decision

The following tech stack is adopted for the MVP:

| Concern | Technology |
|---------|-----------|
| Framework | **Next.js 14+ (App Router)** with TypeScript strict mode |
| Styling | **TailwindCSS** |
| Database ORM | **Prisma** |
| Database (MVP) | **SQLite** (file-based, zero external dependency) |
| Database (production-ready) | **PostgreSQL** (same Prisma schema, no changes required) |
| Testing | **Vitest** (unit/smoke); `next build` (CI integration smoke test) |
| Containerisation | **Docker** + `docker compose` for local development |
| Local dev shortcut | `make dev` |
| CI/CD | **GitHub Actions** (PR Validation → CI versioning → Release) |
| Package manager | **npm** (Husky pre-commit hooks: lint + type check) |

## Rationale

**Next.js App Router** was chosen because:
- Provides both the UI (React Server Components) and the API (Route Handlers) in a single deployable unit — no separate backend service needed for an MVP.
- App Router enables server components by default, reducing client-side JavaScript and making data fetching patterns explicit.
- First-class TypeScript support and well-understood deployment via Docker.

**TailwindCSS** was chosen for rapid, consistent UI development without a heavyweight component library, keeping bundle size small and reducing CSS naming overhead.

**Prisma + SQLite → Postgres** was chosen because:
- Prisma's schema-first approach provides type-safe database access with zero raw SQL.
- SQLite requires no external database daemon during local development or demo.
- Switching to Postgres only requires changing the `DATABASE_URL` and datasource provider in `schema.prisma` — no model or query changes.

**Vitest** was chosen over Jest because it integrates natively with the Vite build tool ecosystem (fast HMR, ESM-first), requires minimal configuration in a Next.js project, and has a Jest-compatible API to minimise the learning curve.

## Alternatives Considered

### Alternative A: Next.js Pages Router

The Pages Router is the legacy routing model. The App Router is the current recommended approach by the Next.js team, supports React Server Components, and provides cleaner separation of server/client boundaries. Rejected in favour of App Router.

### Alternative B: Separate Express.js API + React SPA

A decoupled architecture (Express backend + Vite/React frontend) would require managing two separate servers, two `package.json` files, CORS configuration, and two Docker images. This adds operational complexity with no benefit for a single-company MVP demo. Rejected in favour of Next.js full-stack.

### Alternative C: Drizzle ORM instead of Prisma

Drizzle is a newer, lighter ORM with a code-first schema. However, Prisma's schema-first DSL, built-in migration tooling (`prisma migrate`), and Prisma Studio make it more accessible for demo/audit contexts where the schema is the primary artefact. Prisma's type generation is also more mature. Rejected in favour of Prisma.

### Alternative D: Jest instead of Vitest

Jest has a larger ecosystem but requires additional configuration (Babel or SWC transform, manual ESM handling) in an App Router project. Vitest works natively with ESM and requires less boilerplate. Rejected in favour of Vitest.

## Consequences

### Positive

- Single deployable Next.js application with co-located UI and API simplifies development and Docker packaging.
- Prisma provides full type safety for all database queries, reducing the risk of runtime data errors.
- SQLite removes the need for a running database service during local development and demos.
- App Router server components reduce client-side JavaScript bundle size and keep data-fetching logic on the server.
- TailwindCSS utility classes keep styling consistent without a dedicated design system.

### Negative

- Next.js App Router is more opinionated about data-fetching patterns than the Pages Router; developers unfamiliar with React Server Components may have a steeper learning curve.
- SQLite does not support all Postgres features (e.g., certain index types, `JSONB` operators); care must be taken to keep the schema Postgres-compatible.
- Prisma's bundle size and cold-start overhead can be a concern in serverless environments; acceptable for a containerised demo, but relevant if the app is later deployed to edge/serverless platforms.
