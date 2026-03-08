import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** DELETE /api/scope3/records/[id] — delete a Scope 3 record. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.scope3Record.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
