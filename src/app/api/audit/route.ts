import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);

  const events = await prisma.auditTrailEvent.findMany({
    where: { companyId: DEMO_COMPANY_ID },
    orderBy: { timestamp: "desc" },
    take: limit,
  });

  return NextResponse.json(events);
}
