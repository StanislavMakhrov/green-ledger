# ADR-005: Supplier Selection and Excel Export

## Status

Accepted

## Context

Feature 003 adds the ability to select one or more suppliers from the `/suppliers` page and
download them as an Excel `.xlsx` file. The feature specification (see
`docs/features/003-supplier-selection-excel-export/specification.md`) calls for:

- A checkbox column in the suppliers table for per-row and "select all" selection.
- A selection counter showing how many suppliers are currently selected.
- An "Export to Excel" button that is disabled when no suppliers are selected.
- A downloaded file named `suppliers-export-YYYY-MM-DD.xlsx` with columns:
  Name, Country, Sector, Contact Email, Status.
- No changes to the Prisma schema.

Three open architecture questions were raised by the Requirements Engineer:

1. **Client-side vs server-side Excel generation** — SheetJS in the browser vs a new API route.
2. **Audit trail** — Should the Excel export be logged in `AuditTrailEvent`, as the PDF export is?
3. **Selection across pagination** — Is selection page-scoped or persistent?

---

## Options Considered

### Option A: Client-side Excel generation (SheetJS/xlsx)

Generate the `.xlsx` entirely in the browser using the `xlsx` npm package (SheetJS).
The supplier data is already loaded in the client component; no server round-trip is needed.

- **Pros:** No new API endpoint; fast (data already in browser); simpler component flow.
- **Cons:** The `xlsx` package (latest public version 0.18.5) has **two unpatched
  vulnerabilities** confirmed in the GitHub Advisory Database:
  - [GHSA-4r6h-8v6p-xvh6] Prototype Pollution — fixed in ≥ 0.19.3 (not on public npm)
  - [GHSA-8g3m-pfgp-95gm] ReDoS — fixed in ≥ 0.20.2 (not on public npm)
  SheetJS moved to a commercial/restricted distribution model; the patched versions are not
  available on the public npm registry. **This option is rejected on security grounds.**

### Option B: Client-side Excel generation (ExcelJS — browser build)

Use ExcelJS (v4.4.0, no known vulnerabilities) in the browser via its browser-specific build.

- **Pros:** No new API endpoint; keeps bundle client-side; no server round-trip.
- **Cons:** ExcelJS is a Node.js-first library. Browser support requires special bundler
  configuration and polyfills for Node.js built-ins (`stream`, `buffer`, etc.) that are not
  part of the existing Next.js configuration. This adds bundler complexity and a larger
  client-side bundle (~700 KB minified). Audit logging requires a separate fire-and-forget
  API call anyway. Not the library's primary, well-tested deployment target.

**Not recommended** — bundler complexity outweighs the benefit of avoiding one endpoint.

### Option C: Server-side Excel generation (ExcelJS in a Route Handler) ✅ Recommended

Generate the `.xlsx` in a new Next.js Route Handler `GET /api/suppliers/export?ids=…` using
ExcelJS (v4.4.0). The client fetches the binary response and triggers a browser download via
a temporary object URL.

- **Pros:**
  - ExcelJS is a Node.js-first library — server-side is its primary, well-tested target.
  - No unpatched vulnerabilities (confirmed via GitHub Advisory Database).
  - Audit logging is natural — happens in the same request after generation, consistent with
    the existing PDF export (`/api/export/pdf` pattern).
  - No bundler changes; the client-side bundle does not grow.
  - The fetch-and-download pattern (`URL.createObjectURL` + temporary `<a>`) is a clean,
    well-understood browser idiom.
- **Cons:**
  - Adds one new API route (`/api/suppliers/export`). The original guidance preferred
    client-side to avoid an extra endpoint; however, the SheetJS security issue makes a
    server-side approach the correct trade-off.
  - Requires an HTTP round-trip; at ≤ 1,000 suppliers and 5 columns this is well within the
    3-second performance budget.

---

## Decision

**Use Option C: server-side Excel generation with ExcelJS in a new Route Handler.**

The SheetJS security findings are the primary driver. ExcelJS 4.4.0 has no known
vulnerabilities and is a mature, actively maintained library designed for Node.js. The cost
of one additional API route is minimal compared to shipping a dependency with unpatched
prototype-pollution and ReDoS vulnerabilities.

---

## Rationale

- **Security first**: Prototype pollution and ReDoS are non-trivial vulnerabilities even in
  a local demo context — they would appear in automated scanning and set a poor precedent.
- **Pattern consistency**: The existing PDF export already uses a server-side Route Handler
  (`GET /api/export/pdf`) with an audit event. The Excel export follows the identical pattern,
  making the codebase more predictable.
- **Separation of concerns**: Excel generation logic belongs in `src/lib/` (shared utilities),
  not in client components. Keeping generation server-side enforces this boundary cleanly.
- **Audit trail**: Logging the export event in `AuditTrailEvent` is consistent with the PDF
  export pattern and requires no extra work in the server-side approach.

---

## Consequences

### Positive

- No vulnerable dependencies added to the project.
- Audit trail is logged automatically, consistent with PDF export.
- Excel generation code is testable in isolation (pure Node.js utility in `src/lib/`).
- Client component stays focused on UI concerns only.

### Negative

- One new API route added. The original guidance preferred to avoid this, but the security
  finding overrides that preference.
- Slightly more code than a pure client-side approach: new route handler + lib utility.

---

## Implementation Notes

High-level guidance for the Developer agent. **Do not implement here** — document only.

### New Dependency

```text
exceljs@4.4.0   (no known vulnerabilities as of 2025-07-14)
```

Add to `src/package.json` under `dependencies`.

### New Files

| File | Purpose |
|------|---------|
| `src/lib/excel/supplier-export.ts` | Pure utility: `generateSupplierExcel(rows)` → `Buffer` |
| `src/app/api/suppliers/export/route.ts` | Route Handler: accepts IDs, fetches from DB, calls utility, logs audit, returns binary |

### Modified Files

| File | Changes |
|------|---------|
| `src/app/(app)/suppliers/suppliers-client.tsx` | Add selection state, checkboxes, export button, counter, `handleExport()` |

---

### `src/lib/excel/supplier-export.ts` — Library Utility

```typescript
Interface SupplierExportRow {
  name: string
  country: string
  sector: string
  contactEmail: string
  status: "active" | "inactive"
}

async function generateSupplierExcel(rows: SupplierExportRow[]): Promise<Buffer>
```

- Creates a new `ExcelJS.Workbook`.
- Adds a worksheet named `"Suppliers"`.
- Writes a header row: `["Name", "Country", "Sector", "Contact Email", "Status"]`.
- Appends one row per supplier.
- Returns the workbook as a `Buffer` via `workbook.xlsx.writeBuffer()`.
- No Prisma access — pure data transformation.

This mirrors the pattern in `src/lib/pdf/report-template.ts` (pure data-in / output-out).

---

### `src/app/api/suppliers/export/route.ts` — Route Handler

**Endpoint:** `GET /api/suppliers/export?ids=id1,id2,...`

Behaviour:

1. Parse `ids` query parameter (comma-separated string).
2. Return HTTP 400 if `ids` is absent or empty.
3. Fetch matching suppliers from Prisma (filtered by `companyId = DEMO_COMPANY_ID` and
   `id IN ids`).
4. Return HTTP 404 if the result set is empty.
5. Call `generateSupplierExcel(rows)` to produce the Buffer.
6. Call `logAuditEvent` with:
   - `entityType: "export"`
   - `entityId: DEMO_COMPANY_ID`
   - `action: "exported"`
   - `actor: "system"`
   - `comment: "Excel export — N suppliers"`
7. Return the buffer with headers:
   - `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
   - `Content-Disposition: attachment; filename="suppliers-export-YYYY-MM-DD.xlsx"`
   - `Cache-Control: no-store`
8. Return HTTP 500 on unexpected errors.

The date in the filename should be derived server-side from `new Date()` formatted as
`YYYY-MM-DD` using ISO string slicing (`new Date().toISOString().slice(0, 10)`).

---

### `src/app/(app)/suppliers/suppliers-client.tsx` — UI Changes

**State additions:**

```ts
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
const [exporting, setExporting]     = useState(false)
const [exportError, setExportError] = useState<string | null>(null)
```

**Derived values** (computed, not stored in state):

```ts
const allSelected = suppliers.length > 0 && selectedIds.size === suppliers.length
const someSelected = selectedIds.size > 0 && selectedIds.size < suppliers.length
```

**`handleExport()` function:**

1. Guard: if `selectedIds.size === 0`, set `exportError = "Please select at least one supplier to export."` and return.
2. Set `exporting = true`, clear `exportError`.
3. Build the query string: `ids = Array.from(selectedIds).join(",")`.
4. `fetch("/api/suppliers/export?ids=...")` with method `GET`.
5. On non-OK response, throw an error read from the JSON body or a generic message.
6. Convert the response to a `Blob`, create an object URL, create a temporary `<a>` element
   with `download` attribute, click it, then revoke the URL.
7. On catch, set `exportError = "Export failed. Please try again."`.
8. Finally, set `exporting = false`.

**Header bar changes:**

```text
[Selection counter: "N supplier(s) selected"]  [Export to Excel ↓]  [+ Add Supplier]
```

- "Export to Excel" button: `disabled={selectedIds.size === 0 || exporting}`.
- When `exporting`, show a loading indicator on the button ("Exporting…").
- `exportError` displayed as an inline error message below the header (same style as
  existing form error).

**Table header row changes:**

- New leftmost `<th>` containing:

  ```html
  <input type="checkbox"
    aria-label="Select all suppliers"
    checked={allSelected}
    ref={...}
    onChange={handleSelectAll}
  />
  ```

- `handleSelectAll`: if currently all selected → clear set; otherwise → add all IDs to set.
- Set `indeterminate` property via a `useEffect` or a callback ref when `someSelected`.

**Table body row changes:**

- New leftmost `<td>` containing:

  ```html
  <input type="checkbox"
    aria-label={`Select ${s.name}`}
    checked={selectedIds.has(s.id)}
    onChange={() => handleToggleSelect(s.id)}
  />
  ```

- `handleToggleSelect(id)`: creates a new `Set` from `selectedIds`; toggles membership.
- Selected row styling: add `bg-green-50` (or `bg-blue-50` for contrast) to the `<tr>`
  when `selectedIds.has(s.id)`.

**Selection reset on data reload:**

- Clear `selectedIds` inside `load()` after data is refreshed (add/delete/token-refresh
  all call `load()`). This prevents stale selections pointing to deleted suppliers.

---

### API Error Handling

| Condition | HTTP Status |
|-----------|-------------|
| `ids` param missing or empty | 400 |
| No matching suppliers found | 404 |
| Generation or DB error | 500 |

---

### Pagination Note

The current suppliers page loads all suppliers in a single query (no pagination). Selection
state is therefore implicitly page-scoped across all visible rows. If pagination is introduced
in the future, the selection model must be revisited: either (a) restrict selection to the
current page only (simplest), or (b) maintain a cross-page selection map keyed by supplier ID
(more complex). This is out of scope for the current feature.

---

### Accessibility

Per the specification's non-functional requirements:

- Each row checkbox must have `aria-label="Select {supplier name}"`.
- The header checkbox must have `aria-label="Select all suppliers"`.
- The "Export to Excel" button must have a visible label; its disabled state must be
  announced to assistive technology via the native `disabled` attribute (not CSS alone).

---

### Performance

ExcelJS serialises the workbook to a Buffer in memory. For 1,000 rows × 5 columns this is
well within the 3-second budget (typically < 100 ms in Node.js). The primary latency is
the Prisma query, which is a simple `findMany` with an `IN` filter and no joins.
