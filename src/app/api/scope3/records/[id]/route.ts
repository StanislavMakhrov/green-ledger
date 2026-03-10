import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import { NextRequest, NextResponse } from "next/server";

// DELETE /api/scope3/records/[id] - delete a scope 3 record
export async function DELETE(
  _req: NextRequest,
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

    return NextResponse.json({ data: { success: true } });
  } catch {
    return NextResponse.json({ error: "Failed to delete scope 3 record" }, { status: 500 });
  }
}
