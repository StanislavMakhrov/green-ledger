import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import { logAuditEvent } from "@/lib/audit";
import { NextRequest, NextResponse } from "next/server";

// GET /api/suppliers/[id] - get a single supplier
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supplier = await prisma.supplier.findFirst({
      where: { id, companyId: DEMO_COMPANY_ID },
    });

    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    return NextResponse.json({ data: supplier });
  } catch {
    return NextResponse.json({ error: "Failed to fetch supplier" }, { status: 500 });
  }
}

// PUT /api/suppliers/[id] - update a supplier
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json() as {
      name?: string;
      country?: string;
      sector?: string;
      contactEmail?: string;
      status?: string;
    };
    const { name, country, sector, contactEmail, status } = body;

    const existing = await prisma.supplier.findFirst({
      where: { id, companyId: DEMO_COMPANY_ID },
    });

    if (!existing) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(country !== undefined && { country }),
        ...(sector !== undefined && { sector }),
        ...(contactEmail !== undefined && { contactEmail }),
        ...(status !== undefined && { status: status as "active" | "inactive" }),
      },
    });

    await logAuditEvent({
      companyId: DEMO_COMPANY_ID,
      entityType: "supplier",
      entityId: supplier.id,
      action: "updated",
      actor: "system",
      comment: `Supplier "${supplier.name}" updated`,
    });

    return NextResponse.json({ data: supplier });
  } catch {
    return NextResponse.json({ error: "Failed to update supplier" }, { status: 500 });
  }
}

// DELETE /api/suppliers/[id] - delete a supplier
export async function DELETE(
  _req: NextRequest,
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

    await prisma.supplier.delete({ where: { id } });

    return NextResponse.json({ data: { success: true } });
  } catch {
    return NextResponse.json({ error: "Failed to delete supplier" }, { status: 500 });
  }
}
