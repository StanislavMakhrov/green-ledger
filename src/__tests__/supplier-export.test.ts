import { describe, it, expect } from "vitest";
import {
  generateSupplierExcel,
  type SupplierExportRow,
} from "@/lib/excel/supplier-export";

const SAMPLE_ROWS: SupplierExportRow[] = [
  {
    name: "Acme Corp",
    country: "DE",
    sector: "Manufacturing",
    contactEmail: "acme@example.com",
    status: "active",
  },
  {
    name: "Beta GmbH",
    country: "FR",
    sector: "Logistics",
    contactEmail: "beta@example.com",
    status: "inactive",
  },
];

describe("generateSupplierExcel", () => {
  // TC-11: Returns a non-empty Buffer with XLSX PK magic bytes
  it("TC-11: returns a Buffer with PK ZIP magic bytes (valid XLSX)", async () => {
    const buffer = await generateSupplierExcel(SAMPLE_ROWS);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
    // XLSX is a ZIP archive; ZIP files start with PK (0x50 0x4B)
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
  });

  // TC-12: Worksheet named "Suppliers" with correct header row
  it("TC-12: produces a worksheet named Suppliers with correct headers", async () => {
    const ExcelJS = (await import("exceljs")).default;
    const buffer = await generateSupplierExcel(SAMPLE_ROWS);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);

    const sheet = workbook.getWorksheet("Suppliers");
    expect(sheet).toBeDefined();

    const headerRow = sheet!.getRow(1);
    const headers = [1, 2, 3, 4, 5].map((col) =>
      headerRow.getCell(col).value
    );
    expect(headers).toEqual([
      "Name",
      "Country",
      "Sector",
      "Contact Email",
      "Status",
    ]);
  });

  // TC-13: Two input rows produce 3 worksheet rows (1 header + 2 data)
  it("TC-13: two input rows produce exactly 3 worksheet rows with correct values", async () => {
    const ExcelJS = (await import("exceljs")).default;
    const buffer = await generateSupplierExcel(SAMPLE_ROWS);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);

    const sheet = workbook.getWorksheet("Suppliers")!;
    // rowCount reflects actual data rows
    expect(sheet.rowCount).toBe(3);

    const row2 = sheet.getRow(2);
    expect(row2.getCell(1).value).toBe("Acme Corp");
    expect(row2.getCell(2).value).toBe("DE");
    expect(row2.getCell(3).value).toBe("Manufacturing");
    expect(row2.getCell(4).value).toBe("acme@example.com");
    expect(row2.getCell(5).value).toBe("active");

    const row3 = sheet.getRow(3);
    expect(row3.getCell(1).value).toBe("Beta GmbH");
    expect(row3.getCell(5).value).toBe("inactive");
  });

  // TC-14: Five input rows produce 6 worksheet rows (no off-by-one)
  it("TC-14: five input rows produce 6 worksheet rows (header + 5 data)", async () => {
    const ExcelJS = (await import("exceljs")).default;
    const fiveRows: SupplierExportRow[] = Array.from({ length: 5 }, (_, i) => ({
      name: `Supplier ${i + 1}`,
      country: "DE",
      sector: "Energy",
      contactEmail: `s${i + 1}@example.com`,
      status: "active",
    }));

    const buffer = await generateSupplierExcel(fiveRows);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);

    const sheet = workbook.getWorksheet("Suppliers")!;
    expect(sheet.rowCount).toBe(6);
  });

  // TC-15: Empty input produces a valid Buffer with header row only (no crash)
  it("TC-15: empty input produces a valid Buffer with only the header row", async () => {
    const ExcelJS = (await import("exceljs")).default;
    const buffer = await generateSupplierExcel([]);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
    // Still starts with PK magic bytes
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);

    const sheet = workbook.getWorksheet("Suppliers")!;
    expect(sheet.rowCount).toBe(1); // header only
  });
});
