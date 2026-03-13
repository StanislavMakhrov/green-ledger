import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
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

    // ── 2. Map to human-readable header keys ──────────────────────────────────
    const rows = suppliers.map((s) => ({
      Name: s.name,
      Country: s.country,
      Sector: s.sector,
      "Contact Email": s.contactEmail,
      Status: s.status,
    }));

    // ── 3. Build XLSX workbook and write to buffer ────────────────────────────
    // Pass explicit header array to ensure headers are written even when rows is
    // empty (json_to_sheet with an empty array would otherwise omit headers).
    const ws = XLSX.utils.json_to_sheet(rows, {
      header: ["Name", "Country", "Sector", "Contact Email", "Status"],
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Suppliers");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    // ── 4. Log audit event (mirrors the PDF export pattern) ──────────────────
    await logAuditEvent({
      companyId: DEMO_COMPANY_ID,
      entityType: "export",
      entityId: DEMO_COMPANY_ID,
      action: "exported",
      actor: "system",
      comment: `Suppliers exported to XLSX — ${suppliers.length} rows`,
    });

    // ── 5. Return binary response ─────────────────────────────────────────────
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to generate XLSX", detail: message },
      { status: 500 }
    );
  }
}
