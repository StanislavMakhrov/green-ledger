# GreenLedger

[![CI](https://github.com/StanislavMakhrov/green-ledger/workflows/CI/badge.svg)](https://github.com/StanislavMakhrov/green-ledger/actions/workflows/ci.yml)
[![PR Validation](https://github.com/StanislavMakhrov/green-ledger/workflows/PR%20Validation/badge.svg)](https://github.com/StanislavMakhrov/green-ledger/actions/workflows/pr-validation.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-SQLite-2D3748?logo=prisma)](https://www.prisma.io/)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

## Automated CSRD/ESRS Climate Reporting for German SMEs

GreenLedger is a B2B SaaS application that helps German Mittelstand companies automate their CSRD/ESRS climate reporting, with a deep focus on Scope 3 supply chain emissions.

## The Problem

German SMEs are increasingly pressured by large customers and auditors to provide Scope 3 emissions data. Today, this process involves:

- Excel/PDF/email questionnaires sent to suppliers
- Inconsistent and incomplete supplier responses
- Missing data requiring proxy estimates without documented assumptions
- No audit trail for methodology decisions

## The Solution

GreenLedger automates the complete workflow:

1. **Supplier Data Collection** — Generate tokenized public forms for suppliers to submit emissions data
2. **Scope 3 Calculation** — Automatic calculation including proxy estimates with documented assumptions
3. **Methodology & Audit Trail** — Every data point tracked with source, confidence, and methodology
4. **CSRD Climate Report Export** — Generate audit-ready PDF reports with full transparency

## Features

- 📊 **Dashboard** — KPI overview: Scope 1, Scope 2, Scope 3, Total emissions
- 🏭 **Supplier Management** — CRUD with tokenized public form links
- 📝 **Emissions Recording** — Scope 1, 2, and 3 data entry with full metadata
- 🔗 **Public Supplier Forms** — Token-based forms for supplier data submission
- 📐 **Materiality Assessment** — Mark and justify material Scope 3 categories
- 📄 **PDF Export** — Audit-ready "CSRD Climate Report" with methodology and assumptions
- 🔍 **Audit Trail** — Every change tracked with actor, timestamp, and context

## Tech Stack

- **Framework:** Next.js (App Router) with TypeScript
- **Styling:** TailwindCSS
- **Database:** SQLite via Prisma (Postgres-migratable)
- **PDF Export:** HTML-to-PDF rendering
- **Tests:** Vitest
- **CI/CD:** GitHub Actions

## Quick Start

### Prerequisites

- Node.js 20+
- npm

### Development

```bash
# Install dependencies
npm install

# Set up database
npx prisma db push

# Seed demo data
npx prisma db seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Docker

```bash
docker compose up
```

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Type check
npm run type-check

# Lint
npm run lint

# Production build
npm run build
```

## Project Structure

```text
green-ledger/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/                # API Route Handlers
│   ├── dashboard/          # Dashboard page
│   ├── suppliers/          # Supplier management
│   ├── scope-1/            # Scope 1 records
│   ├── scope-2/            # Scope 2 records
│   ├── scope-3/            # Scope 3 records
│   ├── methodology/        # Methodology notes
│   ├── export/             # PDF export
│   └── public/supplier/    # Public supplier form
├── lib/                    # Shared utilities & business logic
├── prisma/                 # Database schema & migrations
├── public/                 # Static assets
├── docs/                   # Documentation
│   ├── spec.md             # Project specification
│   ├── features.md         # Feature descriptions
│   └── agents.md           # Agent workflow documentation
├── .github/                # CI/CD, agents, skills
└── scripts/                # Development & CI scripts
```

## Documentation

- [Project Specification](docs/spec.md) — Complete product spec, domain model, business rules
- [Features](docs/features.md) — User-facing feature documentation
- [Agent Workflow](docs/agents.md) — AI agent-based development workflow
- [Contributing](CONTRIBUTING.md) — Development guidelines

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow, branch strategy, and coding conventions.

## License

[MIT](LICENSE)
