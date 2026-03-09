import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import { NextResponse } from "next/server";

// GET /api/methodology - list all methodology notes for demo company
export async function GET() {
  try {
    const notes = await prisma.methodologyNote.findMany({
      where: { companyId: DEMO_COMPANY_ID },
      orderBy: { scope: "asc" },
    });

    return NextResponse.json({ data: notes });
  } catch {
    return NextResponse.json({ error: "Failed to fetch methodology notes" }, { status: 500 });
  }
}
