import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/suppliers/by-token/[token] — look up supplier info by public form token. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supplier = await prisma.supplier.findUnique({
    where: { publicFormToken: token },
    include: { company: { select: { name: true } } },
  });
  if (!supplier) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    id: supplier.id,
    name: supplier.name,
    company: supplier.company,
  });
}
