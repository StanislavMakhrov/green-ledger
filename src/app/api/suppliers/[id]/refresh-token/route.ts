import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/audit";
import { DEMO_COMPANY_ID } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.supplier.findFirst({
      where: { id, companyId: DEMO_COMPANY_ID },
    });

    if (!existing) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    const newToken = crypto.randomUUID();
    const supplier = await prisma.supplier.update({
      where: { id },
      data: { publicFormToken: newToken },
    });

    await createAuditEvent(prisma, {
      entityType: "supplier",
      entityId: id,
      action: "updated",
      actor: "user",
      comment: "Public form token refreshed",
    });

    return NextResponse.json({ publicFormToken: supplier.publicFormToken });
  } catch (error) {
    console.error("Refresh token error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
