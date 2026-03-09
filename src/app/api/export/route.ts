import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/audit";
import { generateReport } from "@/lib/pdf/generate-report";
import { DEMO_COMPANY_ID } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const buffer = await generateReport(prisma);

    await createAuditEvent(prisma, {
      companyId: DEMO_COMPANY_ID,
      entityType: "export",
      entityId: DEMO_COMPANY_ID,
      action: "exported",
      actor: "user",
      comment: "CSRD Climate Report PDF generated",
    });

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="csrd-climate-report.pdf"',
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
