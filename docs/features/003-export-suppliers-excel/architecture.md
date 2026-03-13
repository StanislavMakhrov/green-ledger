# ADR-005: Excel Export for Suppliers

## Status

Accepted

## Context

Feature 003 requires a one-click export of all suppliers to an `.xlsx` file
(see `docs/features/003-export-suppliers-excel/specification.md`).

The Supplier model (`src/prisma/schema.prisma`) has fields:
`id`, `companyId`, `name`, `country`, `sector`, `contactEmail`,
`publicFormToken`, `status`.

The export must include only: **Name, Country, Sector, Contact Email, Status**.
`publicFormToken` is an internal security token and must be excluded.

An existing reference export exists at `src/app/api/export/pdf/route.ts` —
this feature follows the same pattern (fetch → transform → respond with binary
→ audit log).

Neither `xlsx` (SheetJS) nor `exceljs` is currently installed in
`src/package.json`.

---

## Options Considered

### Option 1: SheetJS community edition (`xlsx`)

- **Description:** Pure-JavaScript `.xlsx` writer, zero native dependencies.
  Produces a binary buffer from a plain JavaScript array of arrays or array of
  objects in a few lines of code.
- **Pros:**
  - Minimal API surface — `XLSX.utils.json_to_sheet()` + `XLSX.utils.book_new()` + `XLSX.write()` is all that is required.
  - Zero native dependencies; works in any Node.js environment including
    Next.js API routes without build-time configuration.
  - Battle-tested: 25 M+ weekly npm downloads.
  - Produces valid `.xlsx` files that open correctly in Excel and LibreOffice.
  - Smaller install footprint than ExcelJS.
- **Cons:**
  - Community edition lacks rich cell-level formatting (colours, merged cells).
    This is acceptable because the spec calls for plain text output.
  - BSL-licensed after v0.18; the last MIT-licensed release (v0.18.5) is still
    widely used. For an internal tool this is not a blocker.

### Option 2: ExcelJS

- **Description:** Full-featured Excel library with support for cell styling,
  charts, images, etc.
- **Pros:**
  - Rich formatting API if colour-coded cells are ever needed.
  - Actively maintained under MIT licence.
- **Cons:**
  - Significantly larger package (≈ 3× the install size of SheetJS).
  - More verbose API for a plain tabular export.
  - Overkill for an MVP with plain text output.

---

## Decision

Use **SheetJS community edition (`xlsx` npm package, latest v0.18.x)** for
`.xlsx` generation.

The export is intentionally plain text (no cell colours), which is exactly the
use-case SheetJS excels at. It adds the least possible overhead to the
dependency tree and follows the "simplest thing that works" principle stated in
`docs/requirements.md`.

---

## Rationale

- The specification explicitly favours a lightweight approach.
- Plain text output satisfies all stated success criteria.
- The SheetJS API maps directly to the "array of objects → sheet → workbook →
  buffer" flow that mirrors how the PDF export builds its payload.
- No native binaries or runtime environment configuration is required (unlike
  Puppeteer/Chromium for PDF).

---

## Consequences

### Positive

- Simple, fast implementation with a stable, well-documented API.
- No additional infrastructure or environment variables required.
- Easy to test: the output buffer can be verified by inspecting the XLSX
  structure in unit tests.

### Negative

- If cell-level styling (e.g., colour-coded status) is required in a future
  iteration, the library may need to be swapped for ExcelJS or the Pro edition
  of SheetJS — this is a known trade-off accepted for MVP.

---

## Implementation Notes

### New dependency

```text
xlsx   (latest v0.18.x, installed in src/)
```

Run `npm install xlsx` inside `src/`.

### New API route

**File:** `src/app/api/export/suppliers/xlsx/route.ts`
**Method:** `GET /api/export/suppliers/xlsx`

Implementation steps (mirror the PDF route pattern):

1. **Fetch suppliers** from Prisma, filtered by `DEMO_COMPANY_ID`, sorted
   alphabetically by `name`:

   ```ts
   const suppliers = await prisma.supplier.findMany({
     where: { companyId: DEMO_COMPANY_ID },
     orderBy: { name: "asc" },
     select: {
       name: true,
       country: true,
       sector: true,
       contactEmail: true,
       status: true,
       // publicFormToken intentionally omitted
     },
   });
   ```

2. **Map to worksheet rows** using human-readable header keys:

   ```ts
   const rows = suppliers.map((s) => ({
     Name: s.name,
     Country: s.country,
     Sector: s.sector,
     "Contact Email": s.contactEmail,
     Status: s.status,
   }));
   ```

3. **Build workbook and write to buffer:**

   ```ts
   import * as XLSX from "xlsx";
   const ws = XLSX.utils.json_to_sheet(rows);
   const wb = XLSX.utils.book_new();
   XLSX.utils.book_append_sheet(wb, ws, "Suppliers");
   const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
   ```

4. **Log audit event** (same pattern as PDF export):

   ```ts
   await logAuditEvent({
     companyId: DEMO_COMPANY_ID,
     entityType: "export",
     entityId: DEMO_COMPANY_ID,
     action: "exported",
     actor: "system",
     comment: `Suppliers exported to XLSX — ${suppliers.length} rows`,
   });
   ```

5. **Return binary response:**

   ```ts
   const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
   const filename = `greenledger-suppliers-${date}.xlsx`;
   return new NextResponse(new Uint8Array(buf as Buffer), {
     status: 200,
     headers: {
       "Content-Type":
         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
       "Content-Disposition": `attachment; filename="${filename}"`,
       "Cache-Control": "no-store",
     },
   });
   ```

6. **Error handling** — wrap the whole handler in `try/catch`; on error return:

   ```ts
   return NextResponse.json(
     { error: "Failed to generate XLSX", detail: message },
     { status: 500 }
   );
   ```

### UI change — suppliers-client.tsx

Add an **"Export to Excel"** anchor/button next to the existing
`+ Add Supplier` button in the toolbar `div` (line ≈ 110):

```tsx
<div className="flex items-center gap-3">
  <a
    href="/api/export/suppliers/xlsx"
    className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg
               hover:bg-gray-50 transition-colors text-sm font-medium"
  >
    ⬇ Export to Excel
  </a>
  <button
    onClick={() => setShowForm(!showForm)}
    className="bg-green-700 text-white px-4 py-2 rounded-lg
               hover:bg-green-800 transition-colors text-sm font-medium"
  >
    + Add Supplier
  </button>
</div>
```

Using a plain `<a>` tag (rather than `fetch()` + blob) triggers the browser's
native file-download flow without any client-side state or loading indicator,
matching the spec's "standard file download behaviour" requirement.

### Columns exported

| Header (XLSX) | Prisma field   |
|---------------|----------------|
| Name          | `name`         |
| Country       | `country`      |
| Sector        | `sector`       |
| Contact Email | `contactEmail` |
| Status        | `status`       |

`publicFormToken` is **not** selected or included.

### Empty-state behaviour

`XLSX.utils.json_to_sheet([])` with an explicit header produces a valid
single-row (header-only) workbook — the specification's empty-state requirement
is satisfied automatically.

### Directory layout after implementation

```text
src/app/api/export/
  pdf/
    route.ts          (existing)
  suppliers/
    xlsx/
      route.ts        (new)
```

### Security considerations

- The route uses `DEMO_COMPANY_ID` (hard-coded constant), consistent with the
  rest of the demo application. No additional auth surface is introduced.
- `publicFormToken` is excluded at the Prisma `select` level — it never
  reaches the serialisation layer.
- `Cache-Control: no-store` prevents proxies from caching the export file.

---

## Components Affected

| File | Change |
|------|--------|
| `src/app/api/export/suppliers/xlsx/route.ts` | **New** — XLSX export API route |
| `src/app/(app)/suppliers/suppliers-client.tsx` | **Modified** — add "Export to Excel" button |
| `src/package.json` | **Modified** — add `xlsx` dependency |
