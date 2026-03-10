import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import { NextRequest, NextResponse } from "next/server";

// POST /api/suppliers/[id]/token - generate/refresh supplier form token
export async function POST(
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

    const token = crypto.randomUUID();

    await prisma.supplier.update({
      where: { id },
      data: { publicFormToken: token },
    });

    const url = `/public/supplier/${token}`;

    return NextResponse.json({ data: { token, url } });
  } catch {
    return NextResponse.json({ error: "Failed to generate token" }, { status: 500 });
  }
}
