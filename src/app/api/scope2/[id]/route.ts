import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** DELETE /api/scope2/[id] — delete a Scope 2 record. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.scope2Record.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
