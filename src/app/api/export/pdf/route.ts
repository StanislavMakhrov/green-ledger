import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import { logAuditEvent } from "@/lib/audit";
import { generateReportHTML, type ReportData } from "@/lib/pdf/report-template";
import { generatePDF } from "@/lib/pdf/generator";

// GET /api/export/pdf - Generate and download the CSRD climate report as PDF
export async function GET() {
  try {
    // ── 1. Fetch all required data ──────────────────────────────────────────
    const company = await prisma.company.findUnique({
      where: { id: DEMO_COMPANY_ID },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const { reportingYear } = company;
    const where = { companyId: DEMO_COMPANY_ID, periodYear: reportingYear };

    const [scope1Agg, scope2Agg, scope3Agg, scope3Records, methodologyNotes] =
      await Promise.all([
        prisma.scope1Record.aggregate({ _sum: { valueTco2e: true }, where }),
        prisma.scope2Record.aggregate({ _sum: { valueTco2e: true }, where }),
        prisma.scope3Record.aggregate({ _sum: { valueTco2e: true }, where }),
        prisma.scope3Record.findMany({
          where,
          include: { category: true },
          orderBy: { category: { code: "asc" } },
        }),
        prisma.methodologyNote.findMany({
          where: { companyId: DEMO_COMPANY_ID },
          orderBy: { scope: "asc" },
        }),
      ]);

    const scope1Total = scope1Agg._sum.valueTco2e ?? 0;
    const scope2Total = scope2Agg._sum.valueTco2e ?? 0;
    const scope3Total = scope3Agg._sum.valueTco2e ?? 0;

    // Aggregate scope 3 by material category (for breakdown table)
    const categoryTotals = new Map<string, { code: string; name: string; total: number }>();
    for (const record of scope3Records) {
      const key = record.categoryId;
      const existing = categoryTotals.get(key);
      if (existing) {
        existing.total += record.valueTco2e;
      } else {
        categoryTotals.set(key, {
          code: record.category.code,
          name: record.category.name,
          total: record.valueTco2e,
        });
      }
    }

    // Data quality items: proxy data, confidence < 1, or non-empty assumptions
    const dataQualityItems = scope3Records
      .filter(
        (r) =>
          r.dataSource === "proxy" ||
          r.confidence < 1 ||
          (r.assumptions !== null && r.assumptions.trim() !== "")
      )
      .map((r) => ({
        categoryName: r.category.name,
        valueTco2e: r.valueTco2e,
        dataSource: r.dataSource,
        confidence: r.confidence,
        assumptions: r.assumptions,
      }));

    // ── 2. Build report data ────────────────────────────────────────────────
    const reportData: ReportData = {
      companyName: company.name,
      reportingYear,
      scope1Total,
      scope2Total,
      scope3Total,
      total: scope1Total + scope2Total + scope3Total,
      scope3Categories: Array.from(categoryTotals.values()).map((c) => ({
        code: c.code,
        name: c.name,
        valueTco2e: c.total,
      })),
      methodologyNotes: methodologyNotes.map((n) => ({
        scope: n.scope,
        text: n.text,
      })),
      dataQualityItems,
    };

    // ── 3. Generate HTML and PDF ────────────────────────────────────────────
    const html = generateReportHTML(reportData);
    const pdfBuffer = await generatePDF(html);

    // ── 4. Log audit event ──────────────────────────────────────────────────
    await logAuditEvent({
      companyId: DEMO_COMPANY_ID,
      entityType: "export",
      entityId: DEMO_COMPANY_ID,
      action: "exported",
      actor: "system",
      comment: `PDF report exported for ${company.name} — year ${reportingYear}`,
    });

    // ── 5. Return PDF as download ───────────────────────────────────────────
    const filename = `greenledger-${company.name.replace(/\s+/g, "-").toLowerCase()}-${reportingYear}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    // Puppeteer / Chromium not available — return informative error
    const message =
      error instanceof Error ? error.message : "Unknown error";

    if (
      message.includes("puppeteer") ||
      message.includes("chromium") ||
      message.includes("executable") ||
      message.includes("Cannot find module")
    ) {
      return NextResponse.json(
        {
          error: "PDF generation unavailable",
          detail:
            "Chromium is not installed or Puppeteer failed to launch. " +
            "In production, ensure Chromium is available at /usr/bin/chromium-browser " +
            "or set PUPPETEER_EXECUTABLE_PATH.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate PDF", detail: message },
      { status: 500 }
    );
  }
}
