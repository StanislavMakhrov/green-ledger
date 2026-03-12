# Features

This document describes the features of this application from a user perspective.

## Overview

This is a B2B SaaS application for German SMEs (Mittelstand) that automates CSRD/ESRS climate reporting with a deep focus on Scope 3 (supply chain) emissions.

## Feature List

Features are tracked as specifications in `docs/features/NNN-<slug>/specification.md`. Each feature progresses through the agent workflow: Requirements → Architecture → Quality → Tasks → Development → Review → Release.

### MVP Features ✅

All MVP features have been implemented in the application.

- **Dashboard** — KPI overview showing Scope 1, Scope 2, Scope 3, and Total emissions
- **Supplier Management** — CRUD operations with tokenized public form link generation
- **Scope 1 Recording** — Manual entry and listing of Scope 1 emission records
- **Scope 2 Recording** — Manual entry and listing of Scope 2 emission records (location-based)
- **Scope 3 Recording** — Categories, records table, and materiality assessment
- **Supplier Public Form** — Token-based public form for supplier data submission
- **Methodology Notes** — Edit and manage methodology documentation per scope
- **PDF Export** — Generate audit-ready "CSRD Climate Report" with full breakdown via Puppeteer
- **Audit Trail** — Track all data changes with actor, timestamp, and context

### Post-MVP Features ✅

These features extend the MVP and have been fully implemented.

#### Feature 003 — Supplier Selection and Excel Export

Users can select one or more suppliers from the Suppliers page and download them as an Excel `.xlsx` file. This provides a structured, spreadsheet-friendly path for sharing supplier lists with colleagues, auditors, or external consultants.

**User-facing capabilities:**

- **Checkbox selection** — A checkbox column appears as the leftmost column in the Suppliers table. Each row can be individually checked or unchecked.
- **Select all** — A "Select all suppliers" checkbox in the table header selects or deselects all currently displayed suppliers at once. It shows an indeterminate state when only some rows are selected.
- **Row highlighting** — Selected rows are visually distinguished with a green background tint (`bg-green-50`).
- **Selection counter** — A label near the Export button shows how many suppliers are currently selected (e.g., "3 supplier(s) selected").
- **Export to Excel button** — An "Export to Excel" button appears in the page header alongside "+ Add Supplier". It is disabled (greyed out) when no suppliers are selected.
- **Browser download** — Clicking "Export to Excel" with at least one supplier selected triggers an immediate browser download of a `.xlsx` file named `suppliers-export-YYYY-MM-DD.xlsx`.
- **Excel file format** — The downloaded file contains a single worksheet titled "Suppliers" with a styled header row and one data row per selected supplier. Columns: **Name**, **Country**, **Sector**, **Contact Email**, **Status**.
- **Error handling** — If the export fails, an inline error message is displayed so the user can retry. A guard message is shown if no suppliers are selected at export time.

**Technical implementation:**

- New API endpoint `GET /api/suppliers/export?ids=id1,id2,...` generates the `.xlsx` server-side using ExcelJS 4.4.0.
- The export is logged as an `AuditTrailEvent` (consistent with the PDF export pattern).
- The SheetJS/xlsx library was evaluated and rejected due to unpatched security vulnerabilities (Prototype Pollution, ReDoS) — see [ADR-005](adr-005-supplier-selection-excel-export.md).
- No Prisma schema changes — uses the existing `Supplier` model fields.
- Selection state (`Set<string>`) is managed locally in `suppliers-client.tsx` and is cleared on data reload (add, delete, token refresh).

**Out of scope:** Filtering/sorting before export, Scope 3 records export, CSV format, scheduled/email delivery, bulk edit/delete from selection.
