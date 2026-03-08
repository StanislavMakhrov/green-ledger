import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "node:crypto";

/** POST /api/suppliers/[id]/refresh-token — generate a new public form token. */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const updated = await prisma.supplier.update({
    where: { id },
    data: { publicFormToken: randomUUID() },
  });
  return NextResponse.json({ publicFormToken: updated.publicFormToken });
}
