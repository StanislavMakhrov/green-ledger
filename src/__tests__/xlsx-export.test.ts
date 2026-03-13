/**
 * Unit tests for GET /api/export/suppliers/xlsx
 *
 * Tests use real ExcelJS execution (exceljs is NOT mocked) to verify actual
 * binary output, while Prisma and the audit helper are mocked so no database
 * connection is required.
 *
 * Test coverage: TC-01 through TC-10 (Feature 003 test plan).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock("@/lib/prisma", () => ({
  prisma: {
    supplier: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/audit", () => ({
  logAuditEvent: vi.fn(),
}));

// ── Fixtures ───────────────────────────────────────────────────────────────────

const SUPPLIER_FIXTURES = [
  {
    name: "Alpha Ltd",
    country: "DE",
    sector: "Energy",
    contactEmail: "alpha@example.com",
    status: "active",
  },
  {
    name: "Beta GmbH",
    country: "FR",
    sector: "Transport",
    contactEmail: "beta@example.com",
    status: "inactive",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Parse a Response body into an ExcelJS workbook. */
async function parseXlsxResponse(response: Response) {
  const arrayBuffer = await response.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(arrayBuffer));
  return workbook;
}

/** Return the first sheet as an array of arrays (header row first). */
function sheetToRows(workbook: ExcelJS.Workbook): unknown[][] {
  const worksheet = workbook.worksheets[0];
  const rows: unknown[][] = [];
  worksheet.eachRow((row) => {
    rows.push(row.values as unknown[]);
  });
  // ExcelJS row.values is 1-indexed (index 0 is null); strip the leading null
  return rows.map((row) => (row as unknown[]).slice(1));
}

/** Return the first sheet as an array of plain objects (using header row as keys). */
function sheetToObjects(workbook: ExcelJS.Workbook): Record<string, unknown>[] {
  const worksheet = workbook.worksheets[0];
  const allRows: unknown[][][] = [];
  worksheet.eachRow((row) => {
    allRows.push([row.values as unknown[]]);
  });

  if (allRows.length < 2) return [];

  // Build header list from first row (strip leading null from 1-indexed values)
  const headerRow = (worksheet.getRow(1).values as unknown[]).slice(1) as string[];
  const result: Record<string, unknown>[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header
    const values = (row.values as unknown[]).slice(1);
    const obj: Record<string, unknown> = {};
    headerRow.forEach((header, i) => {
      obj[header] = values[i];
    });
    result.push(obj);
  });

  return result;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("GET /api/export/suppliers/xlsx", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: log audit event succeeds
    vi.mocked(logAuditEvent).mockResolvedValue(undefined);
  });

  // TC-01 — HTTP 200 with non-empty body
  it("TC-01: returns HTTP 200 with non-empty binary body when suppliers exist", async () => {
    vi.mocked(prisma.supplier.findMany).mockResolvedValue(
      SUPPLIER_FIXTURES as never
    );

    const { GET } = await import("@/app/api/export/suppliers/xlsx/route");
    const response = await GET();

    expect(response.status).toBe(200);
    const ab = await response.arrayBuffer();
    expect(ab.byteLength).toBeGreaterThan(0);
  });

  // TC-02 — Content-Disposition with date-stamped filename
  it("TC-02: Content-Disposition matches date-stamped filename pattern", async () => {
    vi.mocked(prisma.supplier.findMany).mockResolvedValue(
      SUPPLIER_FIXTURES as never
    );

    const { GET } = await import("@/app/api/export/suppliers/xlsx/route");
    const response = await GET();

    const disposition = response.headers.get("Content-Disposition");
    expect(disposition).toMatch(
      /^attachment; filename="greenledger-suppliers-\d{4}-\d{2}-\d{2}\.xlsx"$/
    );
  });

  // TC-03 — Cache-Control: no-store
  it("TC-03: Cache-Control header equals no-store", async () => {
    vi.mocked(prisma.supplier.findMany).mockResolvedValue(
      SUPPLIER_FIXTURES as never
    );

    const { GET } = await import("@/app/api/export/suppliers/xlsx/route");
    const response = await GET();

    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  // TC-04 — Correct Content-Type
  it("TC-04: Content-Type is the XLSX MIME type", async () => {
    vi.mocked(prisma.supplier.findMany).mockResolvedValue(
      SUPPLIER_FIXTURES as never
    );

    const { GET } = await import("@/app/api/export/suppliers/xlsx/route");
    const response = await GET();

    expect(response.headers.get("Content-Type")).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
  });

  // TC-05 — Header row contains the five specified column names
  it("TC-05: first row is the header row with the five specified columns", async () => {
    vi.mocked(prisma.supplier.findMany).mockResolvedValue(
      SUPPLIER_FIXTURES as never
    );

    const { GET } = await import("@/app/api/export/suppliers/xlsx/route");
    const response = await GET();

    const wb = await parseXlsxResponse(response);
    const rows = sheetToRows(wb);

    expect(rows[0]).toEqual([
      "Name",
      "Country",
      "Sector",
      "Contact Email",
      "Status",
    ]);
  });

  // TC-06 — Data rows match fixture values
  it("TC-06: data rows match the supplier fixtures exactly", async () => {
    vi.mocked(prisma.supplier.findMany).mockResolvedValue(
      SUPPLIER_FIXTURES as never
    );

    const { GET } = await import("@/app/api/export/suppliers/xlsx/route");
    const response = await GET();

    const wb = await parseXlsxResponse(response);
    const dataRows = sheetToObjects(wb);

    expect(dataRows).toHaveLength(2);
    expect(dataRows[0]).toMatchObject({
      Name: "Alpha Ltd",
      Country: "DE",
      Sector: "Energy",
      "Contact Email": "alpha@example.com",
      Status: "active",
    });
    expect(dataRows[1]).toMatchObject({
      Name: "Beta GmbH",
      Country: "FR",
      Sector: "Transport",
      "Contact Email": "beta@example.com",
      Status: "inactive",
    });
  });

  // TC-07 — publicFormToken absent from all rows and headers
  it("TC-07: publicFormToken is absent from all XLSX headers and cells", async () => {
    // Include publicFormToken in the fixture to simulate a leak scenario
    const fixturesWithToken = SUPPLIER_FIXTURES.map((s) => ({
      ...s,
      publicFormToken: "secret-token-uuid",
    }));
    vi.mocked(prisma.supplier.findMany).mockResolvedValue(
      fixturesWithToken as never
    );

    const { GET } = await import("@/app/api/export/suppliers/xlsx/route");
    const response = await GET();

    const wb = await parseXlsxResponse(response);
    const allRows = sheetToRows(wb);

    // Flatten all cells and verify the token is not present anywhere
    const allCells = allRows.flat().map(String);
    expect(allCells).not.toContain("publicFormToken");
    expect(allCells).not.toContain("secret-token-uuid");
  });

  // TC-08 — Empty supplier list returns header-only XLSX
  it("TC-08: empty supplier list returns HTTP 200 with header-only XLSX", async () => {
    vi.mocked(prisma.supplier.findMany).mockResolvedValue([] as never);

    const { GET } = await import("@/app/api/export/suppliers/xlsx/route");
    const response = await GET();

    expect(response.status).toBe(200);

    const wb = await parseXlsxResponse(response);
    const rows = sheetToRows(wb);

    // Only the header row — no data rows
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual([
      "Name",
      "Country",
      "Sector",
      "Contact Email",
      "Status",
    ]);
  });

  // TC-09 — logAuditEvent called exactly once with correct payload
  it("TC-09: logAuditEvent is called exactly once with action=exported and entityType=export", async () => {
    vi.mocked(prisma.supplier.findMany).mockResolvedValue(
      SUPPLIER_FIXTURES as never
    );

    const { GET } = await import("@/app/api/export/suppliers/xlsx/route");
    await GET();

    expect(logAuditEvent).toHaveBeenCalledTimes(1);
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "exported",
        entityType: "export",
      })
    );

    // Verify the comment includes the supplier count
    const callArg = vi.mocked(logAuditEvent).mock.calls[0][0];
    expect(callArg.comment).toMatch(/2\s+rows/);
  });

  // TC-10 — DB error returns HTTP 500 JSON
  it("TC-10: DB error returns HTTP 500 with JSON error body", async () => {
    vi.mocked(prisma.supplier.findMany).mockRejectedValue(
      new Error("DB connection failed")
    );

    const { GET } = await import("@/app/api/export/suppliers/xlsx/route");
    const response = await GET();

    expect(response.status).toBe(500);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body).toMatchObject({ error: "Failed to generate XLSX" });
  });
});
