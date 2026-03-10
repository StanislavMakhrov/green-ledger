import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import { NextRequest, NextResponse } from "next/server";

// GET /api/scope2 - list scope 2 records for demo company (current year)
export async function GET() {
  try {
    const company = await prisma.company.findUnique({
      where: { id: DEMO_COMPANY_ID },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const records = await prisma.scope2Record.findMany({
      where: { companyId: DEMO_COMPANY_ID, periodYear: company.reportingYear },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: records });
  } catch {
    return NextResponse.json({ error: "Failed to fetch scope 2 records" }, { status: 500 });
  }
}

// POST /api/scope2 - create a scope 2 record
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      periodYear?: number;
      valueTco2e?: number;
      calculationMethod?: string;
      emissionFactorsSource?: string;
      dataSource?: string;
      assumptions?: string;
    };
    const { periodYear, valueTco2e, calculationMethod, emissionFactorsSource, dataSource, assumptions } = body;

    if (
      periodYear === undefined ||
      valueTco2e === undefined ||
      !calculationMethod ||
      !emissionFactorsSource ||
      !dataSource
    ) {
      return NextResponse.json(
        { error: "Missing required fields: periodYear, valueTco2e, calculationMethod, emissionFactorsSource, dataSource" },
        { status: 400 }
      );
    }

    const record = await prisma.scope2Record.create({
      data: {
        id: crypto.randomUUID(),
        companyId: DEMO_COMPANY_ID,
        periodYear,
        valueTco2e,
        calculationMethod,
        emissionFactorsSource,
        dataSource: dataSource as "manual" | "csv_import",
        assumptions: assumptions ?? null,
      },
    });

    return NextResponse.json({ data: record }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create scope 2 record" }, { status: 500 });
  }
}
