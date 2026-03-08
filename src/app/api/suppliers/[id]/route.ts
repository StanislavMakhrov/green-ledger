import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** PATCH /api/suppliers/[id] — update supplier fields. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const updated = await prisma.supplier.update({
    where: { id },
    data: {
      name: body.name,
      country: body.country,
      sector: body.sector,
      contactEmail: body.contactEmail,
      status: body.status,
    },
  });
  return NextResponse.json(updated);
}

/** DELETE /api/suppliers/[id] — delete a supplier. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.supplier.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
