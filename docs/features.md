# Features

This document describes the features of GreenLedger from a user perspective.

## Overview

GreenLedger is a B2B SaaS application for German SMEs (Mittelstand) that automates CSRD/ESRS climate reporting with a deep focus on Scope 3 (supply chain) emissions.

## Planned Features

Features are tracked as specifications in `docs/features/NNN-<slug>/specification.md`. Each feature progresses through the agent workflow: Requirements → Architecture → Quality → Tasks → Development → Review → Release.

### MVP Features

See [docs/features/001-mvp/specification.md](features/001-mvp/specification.md) for the full Feature Specification.

| Feature Area | Page(s) | Status |
|---|---|---|
| **Dashboard** | `/dashboard` | Specified |
| **Supplier Management** | `/suppliers` | Specified |
| **Scope 1 Recording** | `/scope-1` | Specified |
| **Scope 2 Recording** | `/scope-2` | Specified |
| **Scope 3 Recording** | `/scope-3` | Specified |
| **Supplier Public Form** | `/public/supplier/[token]` | Specified |
| **Methodology Notes** | `/methodology` | Specified |
| **PDF Export** | `/export` | Specified |
| **Audit Trail** | (DB only, no UI) | Specified |

**Summary of in-scope capabilities:**

- **Dashboard** — KPI overview showing Scope 1, Scope 2, Scope 3, and Total emissions for the reporting year
- **Supplier Management** — CRUD operations with tokenized public form link generation and refresh
- **Scope 1 Recording** — Manual entry and listing of Scope 1 emission records
- **Scope 2 Recording** — Manual entry and listing of Scope 2 emission records (location-based only)
- **Scope 3 Recording** — Categories panel (materiality toggle) + records table; manual record entry
- **Supplier Public Form** — Unauthenticated token-based form for supplier activity data submission with proxy calculation
- **Methodology Notes** — Edit and save free-text methodology notes per scope (Scope 1, 2, 3)
- **PDF Export** — Generate and download an audit-ready "CSRD Climate Report" PDF
- **Audit Trail** — Append-only event log for all data changes (stored in DB; no UI in MVP)
