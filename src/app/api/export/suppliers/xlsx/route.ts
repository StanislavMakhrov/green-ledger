import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import { logAuditEvent } from "@/lib/audit";

// GET /api/export/suppliers/xlsx — Export all suppliers as an Excel file
export async function GET() {
  try {
    // ── 1. Fetch suppliers (five columns only; publicFormToken intentionally omitted) ──
    const suppliers = await prisma.supplier.findMany({
      where: { companyId: DEMO_COMPANY_ID },
      orderBy: { name: "asc" },
      select: {
        name: true,
        country: true,
        sector: true,
        contactEmail: true,
        status: true,
        // publicFormToken is an internal security token — never exported
      },
    });

    // ── 2. Build XLSX workbook with ExcelJS (MIT-licensed, no known CVEs) ─────
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Suppliers");

    // Define columns with explicit headers so the header row is always written,
    // even when the suppliers array is empty.
    worksheet.columns = [
      { header: "Name", key: "name" },
      { header: "Country", key: "country" },
      { header: "Sector", key: "sector" },
      { header: "Contact Email", key: "contactEmail" },
      { header: "Status", key: "status" },
    ];

    for (const s of suppliers) {
      worksheet.addRow({
        name: s.name,
        country: s.country,
        sector: s.sector,
        contactEmail: s.contactEmail,
        status: s.status,
      });
    }

    const buf = await workbook.xlsx.writeBuffer();

    // ── 3. Log audit event (mirrors the PDF export pattern) ──────────────────
    await logAuditEvent({
      companyId: DEMO_COMPANY_ID,
      entityType: "export",
      entityId: DEMO_COMPANY_ID,
      action: "exported",
      actor: "system",
      comment: `Suppliers exported to XLSX — ${suppliers.length} rows`,
    });

    // ── 4. Return binary response ─────────────────────────────────────────────
    const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const filename = `greenledger-suppliers-${date}.xlsx`;
    const bodyBuffer = Buffer.from(buf);

    return new NextResponse(new Uint8Array(bodyBuffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": bodyBuffer.length.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to generate XLSX", detail: message },
      { status: 500 }
    );
  }
}
