# Feature: Supplier Selection and Excel Export

**Feature Number:** 003
**Slug:** supplier-selection-excel-export

---

## Overview

This feature allows users to select one or more suppliers from the Suppliers list page and download the selected supplier data as an Excel (.xlsx) file. Currently, the Suppliers page provides a table listing all suppliers with their key details, but there is no way to select suppliers or export them in a structured spreadsheet format.

**Problem solved:**

- Users (climate managers, CSRD reporting teams) need to share supplier lists and data with colleagues, auditors, or external consultants who work in Excel.
- Currently there is no structured export path for supplier data — only a PDF CSRD Climate Report exists.
- Manual copying of supplier data from the browser table is tedious and error-prone.

---

## User Goals

- Select individual suppliers from the suppliers table using checkboxes.
- Select all visible suppliers at once using a "select all" checkbox in the table header.
- Download the selected suppliers' data as an Excel file (.xlsx) with a single click.
- Receive useful feedback when no suppliers are selected and they attempt to export.

---

## Scope

### In Scope

- Checkbox column added to the Suppliers table for per-row selection.
- "Select All" checkbox in the table header to select/deselect all currently displayed suppliers.
- An "Export to Excel" button that becomes active when at least one supplier is selected.
- Exported Excel file contains one row per selected supplier with these columns:
  - Name
  - Country
  - Sector
  - Contact Email
  - Status (active/inactive)
- The Excel file is downloaded directly by the browser (client-side download or server-side file response).
- The exported filename should follow the pattern: `suppliers-export-YYYY-MM-DD.xlsx`.

### Out of Scope

- Filtering or sorting suppliers before export (filtering/sorting is not yet in the UI).
- Exporting Scope 3 emissions records linked to suppliers (supplier data only).
- Exporting the public form token or form URL in the Excel file.
- Scheduling or emailing the export.
- CSV export (Excel/.xlsx only per the feature request).
- Exporting suppliers in the CSRD PDF report (that is a separate export).
- Bulk edit or bulk delete based on selection.
- Persisting selection state across page reloads.

---

## User Experience

### Supplier Selection

1. On the `/suppliers` page, a new checkbox column appears as the first column in the table.
2. Each row has a checkbox that the user can tick to select that supplier.
3. The table header has a "select all" checkbox that, when checked, selects all rows in the current view; when unchecked, deselects all.
4. Selected rows are visually highlighted (e.g., a light background tint) to make it clear which suppliers are selected.
5. A selection summary is shown near the export button, e.g. "3 supplier(s) selected".

### Excel Export

1. An "Export to Excel" button appears in the page header area (alongside the existing "+ Add Supplier" button).
2. The button is **disabled** (greyed out) when no suppliers are selected.
3. When the user has selected at least one supplier and clicks "Export to Excel":
   - The browser downloads an `.xlsx` file named `suppliers-export-YYYY-MM-DD.xlsx`.
   - The file contains a single worksheet titled "Suppliers".
   - The first row contains column headers: Name, Country, Sector, Contact Email, Status.
   - Each subsequent row corresponds to one selected supplier.
4. If no suppliers are selected and the user still manages to trigger export (e.g., keyboard), a brief inline message is shown: "Please select at least one supplier to export."

### Error Handling

- If the export fails (e.g., server error), an inline error message is displayed: "Export failed. Please try again."
- The button returns to its enabled state after a failed export so the user can retry.

---

## Success Criteria

- [ ] A checkbox column appears as the leftmost column in the Suppliers table.
- [ ] Checking the header checkbox selects all visible supplier rows; unchecking it deselects all.
- [ ] Individual row checkboxes can be toggled independently.
- [ ] Selected rows are visually distinct from unselected rows.
- [ ] A selection counter shows how many suppliers are currently selected (e.g., "3 selected").
- [ ] An "Export to Excel" button is visible on the Suppliers page.
- [ ] The "Export to Excel" button is disabled when zero suppliers are selected.
- [ ] Clicking "Export to Excel" with at least one supplier selected triggers a browser download of an `.xlsx` file.
- [ ] The downloaded file is named `suppliers-export-YYYY-MM-DD.xlsx`.
- [ ] The downloaded file contains the correct columns: Name, Country, Sector, Contact Email, Status.
- [ ] Each selected supplier appears as exactly one row in the exported file.
- [ ] Suppliers that are NOT selected do NOT appear in the exported file.
- [ ] Selecting all suppliers and exporting produces a file with all suppliers.
- [ ] Existing supplier functionality (add, delete, toggle status, copy form link, refresh token) is unaffected.

---

## Data Model Changes

No changes to the Prisma schema are required. The feature uses the existing `Supplier` model fields:

| Field | Exported As |
|-------|-------------|
| `name` | Name |
| `country` | Country |
| `sector` | Sector |
| `contactEmail` | Contact Email |
| `status` | Status |

The `publicFormToken` and `id` fields are intentionally excluded from the export.

---

## API Changes

A new API endpoint is needed to generate and return the Excel file:

**`GET /api/suppliers/export?ids=id1,id2,...`**

- Accepts a comma-separated list of supplier IDs as a query parameter.
- Returns an `.xlsx` file as a binary response with content type `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
- Returns HTTP 400 if no IDs are provided.
- Returns HTTP 404 if no matching suppliers are found for the given IDs.
- Returns HTTP 500 on server error.

_Alternative_: Export can be done entirely client-side using a library like `xlsx` (SheetJS), avoiding the need for a new API route. The Architect should evaluate the best approach given the project's minimal-dependency preference.

---

## UI Changes

Changes are confined to the existing Suppliers page (`/suppliers`) and its client component (`suppliers-client.tsx`):

1. **Checkbox column**: New leftmost `<th>` and `<td>` cells with `<input type="checkbox">` elements.
2. **"Select All" header checkbox**: In the `<thead>` of the Suppliers table.
3. **Selection state**: A `selectedIds: Set<string>` state variable tracks selected supplier IDs.
4. **Row highlight**: Selected rows receive a CSS class for visual differentiation (e.g., `bg-green-50`).
5. **Export button**: New button in the page header next to "+ Add Supplier", labelled "Export to Excel" with a download icon.
6. **Selection counter**: A small label near the export button showing "N selected".
7. **Disabled state**: The export button uses `disabled` attribute and opacity styling when `selectedIds.size === 0`.

---

## Non-Functional Requirements

- **Performance**: The Excel generation must complete in under 3 seconds for up to 1,000 suppliers.
- **Correctness**: All selected supplier fields must appear exactly as stored in the database (no rounding, truncation, or transformation of text fields).
- **Accessibility**: Checkboxes must have accessible labels (e.g., `aria-label="Select {supplier name}"`); the "select all" checkbox must have `aria-label="Select all suppliers"`.
- **Browser compatibility**: The download must work in modern browsers (Chrome, Firefox, Edge, Safari) without requiring browser plugins.
- **No new authentication requirements**: The export endpoint (if server-side) is accessible to the same unauthenticated demo session as all other routes (consistent with the project's no-auth approach).

---

## Open Questions

1. **Client-side vs server-side Excel generation**: Should the Excel file be generated in the browser (using a JS library like SheetJS/xlsx), or server-side in a new API route? Client-side avoids a new API endpoint and server load; server-side keeps the client bundle smaller. _Recommend: Architect decides based on bundle size impact._

2. **Selection persistence across pagination/filtering**: If pagination or filtering is added to the Suppliers table in the future, should selection be scoped to the current page only, or persist across pages? _For now (no pagination), this is not a concern, but it should be noted as a potential future consideration._

3. **Audit trail**: Should exporting suppliers to Excel be logged in the `AuditTrailEvent` table? The existing PDF export creates an audit event (`action: exported`, `entityType: export`). Consistency would suggest yes, but the feature request does not mention it. _Recommend: Log it for consistency; Architect/Maintainer to confirm._
