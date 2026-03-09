# Features

This document describes the features of GreenLedger from a user perspective.

## Overview

GreenLedger is a B2B SaaS application for German SMEs (Mittelstand) that automates CSRD/ESRS climate reporting with a deep focus on Scope 3 (supply chain) emissions.

## MVP Features

The MVP is fully implemented. All source code lives in `src/`. See [docs/spec.md](spec.md) for the complete project specification and [docs/features/001-mvp/specification.md](features/001-mvp/specification.md) for the detailed feature specification.

---

### Dashboard (`/dashboard`)

The dashboard gives a sustainability manager an instant overview of the company's total greenhouse gas footprint for the configured reporting year.

**What it does:**

- Displays four KPI cards: **Scope 1**, **Scope 2**, **Scope 3**, and **Total** emissions (tCO₂e)
- Values are computed as the sum of all records in the database for the configured `reportingYear`
- Shows zero values (not blank or error) when no records exist yet

**Reporting year:** Defaults to `2024`. Override by setting the `REPORTING_YEAR` environment variable before starting the server.

---

### Suppliers (`/suppliers`)

The suppliers page lets a sustainability manager manage the company's supplier list and generate tokenised form links for data collection — no supplier registration required.

**What it does:**

- Lists all suppliers in a table: name, country, sector, contact email, status, and actions
- **Add** a new supplier with: name, country, sector, contact email
- **Edit** an existing supplier's details
- **Delete** a supplier
- **Copy link** — copies the unique public form URL (token-based) to the clipboard
- **Refresh token** — regenerates a supplier's token, immediately invalidating the old URL

Each supplier has a unique `publicFormToken` (UUID-grade random string). The public form URL follows the pattern `/public/supplier/[token]`.

---

### Scope 1 — Direct Emissions (`/scope-1`)

Scope 1 covers direct greenhouse gas emissions from sources owned or controlled by the company (e.g. on-site combustion, company vehicles).

**What it does:**

- Lists all Scope 1 records in a table with date added
- **Add a record** with: period year, value (tCO₂e), calculation method, emission factors source, data source, and optional assumptions
- **Delete** a record
- Records contribute to the Scope 1 total on the Dashboard

---

### Scope 2 — Energy Emissions (`/scope-2`)

Scope 2 covers indirect greenhouse gas emissions from the generation of purchased or acquired electricity, steam, heat, or cooling.

**What it does:**

- Lists all Scope 2 records in a table with date added
- **Add a record** (location-based method) with: period year, value (tCO₂e), calculation method, emission factors source, data source, and optional assumptions
- **Delete** a record
- Records contribute to the Scope 2 total on the Dashboard

---

### Scope 3 — Supply Chain Emissions (`/scope-3`)

Scope 3 covers all indirect emissions not included in Scope 2 — primarily from the company's value chain and supply chain. This is typically the largest source of emissions for Mittelstand companies.

**What it does:**

**Categories view:**

- Lists all 15 ESRS Scope 3 categories (C1–C15) with their standard names
- **Mark a category as material** — toggle the material flag and enter a materiality reason
- Material categories appear in the PDF export breakdown table

**Records view:**

- Lists all Scope 3 records showing: supplier (if linked), category, value (tCO₂e), data source, confidence score, and date
- **Add a record** with: category (dropdown), supplier (optional), period year, value (tCO₂e), calculation method (`spend_based` / `activity_based` / `supplier_specific`), emission factor source, data source, optional assumptions, and confidence score (0–1)
- Records contribute to the Scope 3 total on the Dashboard

---

### Methodology Notes (`/methodology`)

The methodology page lets a sustainability manager document exactly how emissions were calculated — a requirement for CSRD/ESRS audit readiness.

**What it does:**

- Provides a text area for each scope: **Scope 1 notes**, **Scope 2 notes**, **Scope 3 notes**
- **Save** each section independently; the last-updated timestamp is displayed
- Methodology notes are embedded verbatim in the PDF export

---

### PDF Export — CSRD Climate Report (`/export`)

The export page generates an audit-ready "CSRD Climate Report" PDF in a single click.

**What it does:**

- Clicking **Generate Report** triggers server-side PDF generation and downloads the file
- Shows a loading state during generation (up to ~15 seconds for typical reports)

**Report contents:**

1. **Cover page** — company name and reporting year
2. **Summary table** — Scope 1, Scope 2, Scope 3, and Total emissions (tCO₂e)
3. **Scope 3 breakdown** — material categories only; a footnote appears if non-material categories also have records
4. **Methodology section** — pulled from the Methodology Notes for each scope
5. **Assumptions & Data Quality** — lists all records where `confidence < 1`, `dataSource = "proxy"`, or assumptions are documented; shows supplier name, category, assumptions, confidence, and data source

PDF generation is performed server-side using `@react-pdf/renderer` (pure JavaScript, no headless browser). An audit trail event is recorded when a report is exported.

---

### Public Supplier Form (`/public/supplier/[token]`)

The public supplier form allows a supplier contact to submit their emissions data without creating an account. The link is generated on the Suppliers page and sent to the supplier by email or any other channel.

**What it does:**

- Publicly accessible — no login required
- Resolves the supplier name from the token and displays it on the form
- Supplier submits one or more of: **Spend (EUR)**, **Transport (tonne-km)**, **Waste (kg)**; at least one is required
- Optionally selects an ESRS Scope 3 category (defaults to C1 — Purchased goods & services)
- On submission, a Scope 3 record is created with `dataSource = "supplier_form"`

**Proxy calculation:** When only `spend_eur` is provided, the system automatically estimates tCO₂e using a spend-based proxy factor (`PROXY_FACTOR_SPEND = 0.233 tCO₂e/EUR`). This factor is a **demo placeholder** — it is not authoritative and is clearly documented in the assumptions field of the resulting record. Similar proxy logic applies for `ton_km` and `waste_kg`.

**Raw activity data** (`spend_eur`, `ton_km`, `waste_kg`) is always stored alongside the computed tCO₂e value.

**Error handling:**

- An invalid or expired token shows a clear "Form not found" error page
- Submission errors are displayed inline

An audit trail event with `actor = "supplier"` is recorded for every successful submission.

---

### Audit Trail

All write operations in GreenLedger are automatically recorded in an audit trail. Every record captures: entity type, entity ID, action, actor (`user` / `supplier` / `system`), timestamp, and an optional comment.

The audit trail covers: supplier creates/edits/deletes, Scope 1/2/3 record creates/deletes, methodology note saves, supplier form submissions, and PDF exports.

> The audit trail is stored in the database (`AuditTrailEvent` table) but does not have a dedicated UI page in the MVP.

---

## Planned Features

Future features beyond the MVP are tracked as specifications in `docs/features/NNN-<slug>/specification.md`. Each feature progresses through the agent workflow: Requirements → Architecture → Quality → Tasks → Development → Review → Release.
