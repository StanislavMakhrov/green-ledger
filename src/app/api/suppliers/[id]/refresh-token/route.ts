import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import { randomUUID } from "crypto";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await prisma.supplier.findFirst({ where: { id, companyId: DEMO_COMPANY_ID } });
  if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updated = await prisma.supplier.update({ where: { id }, data: { publicFormToken: randomUUID() } });
  return NextResponse.json({ publicFormToken: updated.publicFormToken });
}
