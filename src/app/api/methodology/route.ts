import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const notes = await prisma.methodologyNote.findMany({
      where: { companyId: DEMO_COMPANY_ID },
      orderBy: { scope: "asc" },
    });
    return NextResponse.json(notes);
  } catch (error) {
    console.error("Methodology GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
