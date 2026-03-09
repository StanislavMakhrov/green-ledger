# Features

This document describes the features of GreenLedger from a user perspective.

## Overview

GreenLedger is a B2B SaaS application for German SMEs (Mittelstand) that automates CSRD/ESRS climate reporting with a deep focus on Scope 3 (supply chain) emissions.

## Features

Features are tracked as specifications in `docs/features/NNN-<slug>/specification.md`. Each feature progresses through the agent workflow: Requirements → Architecture → Quality → Tasks → Development → Review → Release.

### MVP Features ✅

All MVP features have been implemented in the GreenLedger application.

- **Dashboard** — KPI overview showing Scope 1, Scope 2, Scope 3, and Total emissions
- **Supplier Management** — CRUD operations with tokenized public form link generation
- **Scope 1 Recording** — Manual entry and listing of Scope 1 emission records
- **Scope 2 Recording** — Manual entry and listing of Scope 2 emission records (location-based)
- **Scope 3 Recording** — Categories, records table, and materiality assessment
- **Supplier Public Form** — Token-based public form for supplier data submission
- **Methodology Notes** — Edit and manage methodology documentation per scope
- **PDF Export** — Generate audit-ready "CSRD Climate Report" with full breakdown via Puppeteer
- **Audit Trail** — Track all data changes with actor, timestamp, and context
