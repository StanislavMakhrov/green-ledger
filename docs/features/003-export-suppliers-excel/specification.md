# Feature: Export Suppliers to Excel

**Feature Number:** 003
**Slug:** export-suppliers-excel

---

## Overview

Users need to export the complete list of suppliers from GreenLedger into a Microsoft Excel (.xlsx) file. This enables them to work with supplier data offline, share it with colleagues, or use it in external reporting workflows — without having to manually copy data from the UI.

---

## User Goals

- As a GreenLedger user, I want to download all my suppliers as an Excel file so that I can work with the data in Excel for reporting, sharing, or bulk review purposes.
- As a GreenLedger user, I want the exported file to contain all relevant supplier fields so that I have complete information without needing to supplement it manually.

---

## Scope

### In Scope

- A single **"Export to Excel"** button on the Suppliers page that triggers a `.xlsx` file download.
- The export includes **all suppliers** for the demo company (no filtering by status or other criteria).
- The exported file contains the following columns, matching the table visible in the UI:
  - **Name** (`name`)
  - **Country** (`country`)
  - **Sector** (`sector`)
  - **Contact Email** (`contactEmail`)
  - **Status** (`status` — "active" or "inactive")
- The file is named descriptively, e.g. `greenledger-suppliers-<YYYY-MM-DD>.xlsx`.
- The first row of the spreadsheet is a header row with human-readable column names.
- Rows are sorted alphabetically by supplier name (consistent with the on-screen list).
- The export is triggered via a server-side API route (`GET /api/export/suppliers/xlsx`) that returns the binary Excel file as a download.
- An audit event is logged when the export is triggered (consistent with the PDF export behaviour).

### Out of Scope

- Filtering or selecting a subset of suppliers for export (e.g. active only).
- Exporting supplier form submission data (Scope 3 records) — only the supplier master data is exported.
- The `publicFormToken` field is **not** included in the export (it is an internal security token).
- CSV or other export formats.
- Scheduled or automatic exports.
- Import from Excel (reverse direction).

---

## User Experience

### Button Placement

An **"Export to Excel"** button is placed in the toolbar area of the Suppliers page, next to the existing **"+ Add Supplier"** button. It is always visible regardless of whether there are any suppliers.

**Visual style:** Consistent with the existing secondary/action button style used on the page. Uses a spreadsheet/download icon (e.g. `⬇ Export to Excel`) to make the action obvious.

### Download Behaviour

1. User clicks "Export to Excel".
2. The browser navigates to `GET /api/export/suppliers/xlsx`.
3. The server generates the `.xlsx` file and responds with:
   - `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
   - `Content-Disposition: attachment; filename="greenledger-suppliers-YYYY-MM-DD.xlsx"`
4. The browser downloads the file automatically (standard file download behaviour).
5. No loading spinner or progress indicator is required for the MVP (download is near-instant for typical supplier counts).

### Empty State

If there are no suppliers, the export still succeeds and returns an Excel file containing only the header row.

### Error Handling

- If the export fails on the server, the user sees a browser-level error (the API returns a `500` JSON response). No custom UI error is required for the MVP.

---

## Success Criteria

- [ ] An "Export to Excel" button is visible on the Suppliers page.
- [ ] Clicking the button downloads a file with the `.xlsx` extension.
- [ ] The downloaded file opens correctly in Microsoft Excel and LibreOffice Calc.
- [ ] The file contains a header row with human-readable column names: Name, Country, Sector, Contact Email, Status.
- [ ] Each supplier in the database appears as exactly one data row in the file.
- [ ] The `publicFormToken` field is **not** present in the exported file.
- [ ] Rows are sorted alphabetically by Name.
- [ ] The filename follows the pattern `greenledger-suppliers-YYYY-MM-DD.xlsx`.
- [ ] An audit log entry is created when the export is triggered.
- [ ] Exporting when there are zero suppliers returns a valid `.xlsx` file with only the header row (no error).
- [ ] The feature works within the existing Next.js App Router and TypeScript conventions.

---

## Open Questions

1. **Excel library choice:** The Architect should decide which library to use for `.xlsx` generation. Candidates include:
   - [`xlsx` (SheetJS)](https://sheetjs.com/) — widely used, zero native dependencies, works in Node.js
   - [`exceljs`](https://github.com/exceljs/exceljs) — richer formatting API, larger bundle
   For the MVP, a lightweight approach (SheetJS community edition) is preferred unless the Architect has a reason to choose otherwise.

2. **Column formatting:** Should the "Status" column use colour-coded cells (green/grey) matching the UI, or plain text values? Plain text is recommended for simplicity unless the Maintainer prefers styled output.
