import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import { randomUUID } from "crypto";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** POST /api/suppliers/[id]/token — regenerate the public form token */
export async function POST(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  const result = await prisma.supplier.updateMany({
    where: { id, companyId: DEMO_COMPANY_ID },
    data: { publicFormToken: `tok-${randomUUID()}` },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.supplier.findUnique({ where: { id } });
  return NextResponse.json(updated);
}
