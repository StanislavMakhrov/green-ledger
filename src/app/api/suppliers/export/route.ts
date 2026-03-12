import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import { logAuditEvent } from "@/lib/audit";
import { generateSupplierExcel } from "@/lib/excel/supplier-export";

// GET /api/suppliers/export?ids=id1,id2,...
// Returns an .xlsx file containing the requested suppliers.
export async function GET(req: NextRequest) {
  try {
    // ── 1. Parse and validate the ids query parameter ───────────────────────
    const idsParam = req.nextUrl.searchParams.get("ids");
    if (!idsParam || idsParam.trim() === "") {
      return NextResponse.json(
        { error: "Missing required query parameter: ids" },
        { status: 400 }
      );
    }

    const ids = idsParam
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "ids parameter must contain at least one supplier ID" },
        { status: 400 }
      );
    }

    // ── 2. Fetch matching suppliers from Prisma ─────────────────────────────
    const suppliers = await prisma.supplier.findMany({
      where: {
        companyId: DEMO_COMPANY_ID,
        id: { in: ids },
      },
      orderBy: { name: "asc" },
    });

    if (suppliers.length === 0) {
      return NextResponse.json(
        { error: "No suppliers found for the provided IDs" },
        { status: 404 }
      );
    }

    // ── 3. Generate the Excel file ──────────────────────────────────────────
    const rows = suppliers.map((s) => ({
      name: s.name,
      country: s.country,
      sector: s.sector,
      contactEmail: s.contactEmail,
      status: s.status as "active" | "inactive",
    }));

    const buffer = await generateSupplierExcel(rows);

    // ── 4. Log audit event ──────────────────────────────────────────────────
    await logAuditEvent({
      companyId: DEMO_COMPANY_ID,
      entityType: "export",
      entityId: DEMO_COMPANY_ID,
      action: "exported",
      actor: "system",
      comment: `Excel export — ${suppliers.length} supplier${suppliers.length === 1 ? "" : "s"}`,
    });

    // ── 5. Return the Excel file as a binary download ───────────────────────
    const date = new Date().toISOString().slice(0, 10);
    const filename = `suppliers-export-${date}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Excel export failed:", error);
    return NextResponse.json(
      { error: "Failed to generate Excel export" },
      { status: 500 }
    );
  }
}
