import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import { NextRequest, NextResponse } from "next/server";

// GET /api/company - get demo company
export async function GET() {
  try {
    const company = await prisma.company.findUnique({
      where: { id: DEMO_COMPANY_ID },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json({ data: company });
  } catch {
    return NextResponse.json({ error: "Failed to fetch company" }, { status: 500 });
  }
}

// PUT /api/company - update demo company
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json() as {
      name?: string;
      country?: string;
      reportingYear?: number;
      orgBoundary?: string;
    };
    const { name, country, reportingYear, orgBoundary } = body;

    const company = await prisma.company.update({
      where: { id: DEMO_COMPANY_ID },
      data: {
        ...(name !== undefined && { name }),
        ...(country !== undefined && { country }),
        ...(reportingYear !== undefined && { reportingYear }),
        ...(orgBoundary !== undefined && { orgBoundary: orgBoundary as Parameters<typeof prisma.company.update>[0]["data"]["orgBoundary"] }),
      },
    });

    return NextResponse.json({ data: company });
  } catch {
    return NextResponse.json({ error: "Failed to update company" }, { status: 500 });
  }
}
