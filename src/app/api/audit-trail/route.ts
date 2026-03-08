import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEMO_COMPANY_ID } from "@/lib/constants";

export async function GET() {
  const events = await prisma.auditTrailEvent.findMany({
    where: { companyId: DEMO_COMPANY_ID },
    orderBy: { timestamp: "desc" },
    take: 50,
  });
  return NextResponse.json(events);
}
