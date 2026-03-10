import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import { NextResponse } from "next/server";

// GET /api/audit - last 50 audit events for demo company, newest first
export async function GET() {
  try {
    const events = await prisma.auditTrailEvent.findMany({
      where: { companyId: DEMO_COMPANY_ID },
      orderBy: { timestamp: "desc" },
      take: 50,
    });

    return NextResponse.json({ data: events });
  } catch {
    return NextResponse.json({ error: "Failed to fetch audit events" }, { status: 500 });
  }
}
