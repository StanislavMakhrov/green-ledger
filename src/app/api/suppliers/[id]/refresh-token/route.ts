import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import { randomUUID } from "crypto";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const updated = await prisma.supplier.update({
    where: { id },
    data: { publicFormToken: randomUUID() },
  });

  await prisma.auditTrailEvent.create({
    data: {
      companyId: DEMO_COMPANY_ID,
      entityType: "supplier",
      entityId: id,
      action: "updated",
      actor: "user",
      comment: "Token refreshed",
    },
  });

  return NextResponse.json(updated);
}
