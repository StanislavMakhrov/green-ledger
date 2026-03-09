import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import { generatePublicFormToken } from "@/lib/token";

export async function POST(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const existing = await prisma.supplier.findFirst({
    where: { id, companyId: DEMO_COMPANY_ID },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.supplier.update({
    where: { id },
    data: { publicFormToken: generatePublicFormToken() },
  });

  return NextResponse.json({ publicFormToken: updated.publicFormToken });
}
