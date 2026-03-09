import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/audit";
import { DEMO_COMPANY_ID } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const records = await prisma.scope2Record.findMany({
      where: { companyId: DEMO_COMPANY_ID },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(records);
  } catch (error) {
    console.error("Scope2 GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      periodYear,
      valueTco2e,
      calculationMethod,
      emissionFactorsSource,
      dataSource,
      assumptions,
    } = body;

    if (
      periodYear === undefined ||
      valueTco2e === undefined ||
      !calculationMethod ||
      !emissionFactorsSource ||
      !dataSource
    ) {
      return NextResponse.json(
        {
          error:
            "periodYear, valueTco2e, calculationMethod, emissionFactorsSource, and dataSource are required",
        },
        { status: 400 }
      );
    }

    const record = await prisma.scope2Record.create({
      data: {
        companyId: DEMO_COMPANY_ID,
        periodYear: Number(periodYear),
        valueTco2e: Number(valueTco2e),
        calculationMethod,
        emissionFactorsSource,
        dataSource,
        assumptions: assumptions || null,
      },
    });

    await createAuditEvent(prisma, {
      entityType: "scope2",
      entityId: record.id,
      action: "created",
      actor: "user",
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Scope2 POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
