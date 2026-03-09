import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/audit";
import { DEMO_COMPANY_ID } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.scope3Category.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const body = await request.json();
    const { material, materialityReason } = body;

    const category = await prisma.scope3Category.update({
      where: { id },
      data: {
        ...(material !== undefined && { material }),
        ...(materialityReason !== undefined && { materialityReason }),
      },
    });

    await createAuditEvent(prisma, {
      companyId: DEMO_COMPANY_ID,
      entityType: "scope3",
      entityId: id,
      action: "updated",
      actor: "user",
      comment: "Category materiality updated",
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Scope3 category PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
