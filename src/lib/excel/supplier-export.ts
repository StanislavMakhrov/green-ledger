import ExcelJS from "exceljs";

/** A single supplier row to be written into the Excel export. */
export interface SupplierExportRow {
  name: string;
  country: string;
  sector: string;
  contactEmail: string;
  status: "active" | "inactive";
}

/**
 * Generate an Excel (.xlsx) workbook buffer from an array of supplier rows.
 *
 * The workbook contains a single worksheet named "Suppliers" with a styled
 * header row and one data row per supplier. Pure data-in / Buffer-out — no
 * Prisma access, no side effects.
 */
export async function generateSupplierExcel(
  rows: SupplierExportRow[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Suppliers");

  // Define columns — widths auto-sized to typical content lengths
  sheet.columns = [
    { header: "Name", key: "name", width: 30 },
    { header: "Country", key: "country", width: 15 },
    { header: "Sector", key: "sector", width: 25 },
    { header: "Contact Email", key: "contactEmail", width: 35 },
    { header: "Status", key: "status", width: 12 },
  ];

  // Style the header row: bold, green background (#16a34a), white text
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF16a34a" },
    };
  });

  // Append one row per supplier
  for (const row of rows) {
    sheet.addRow({
      name: row.name,
      country: row.country,
      sector: row.sector,
      contactEmail: row.contactEmail,
      status: row.status,
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
