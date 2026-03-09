import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/audit";
import { DEMO_COMPANY_ID } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.scope3Record.findFirst({
      where: { id, companyId: DEMO_COMPANY_ID },
    });

    if (!existing) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    await prisma.scope3Record.delete({ where: { id } });

    await createAuditEvent(prisma, {
      entityType: "scope3",
      entityId: id,
      action: "deleted",
      actor: "user",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Scope3 record DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
