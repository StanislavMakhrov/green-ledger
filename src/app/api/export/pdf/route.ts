import { NextResponse } from "next/server";
import { buildReportHtml } from "@/lib/pdf";
import { createAuditEvent } from "@/lib/audit";
import { DEMO_COMPANY_ID } from "@/lib/constants";

export async function GET() {
  try {
    const html = await buildReportHtml();
    const puppeteer = await import("puppeteer");
    const browser = await puppeteer.default.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();
    await createAuditEvent({ companyId: DEMO_COMPANY_ID, entityType: "export", entityId: "pdf-report", action: "exported", actor: "user", comment: "CSRD Climate Report PDF exported" });
    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="csrd-climate-report.pdf"' },
    });
  } catch (error) {
    console.error("PDF export error:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
