import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/audit";
import { DEMO_COMPANY_ID } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const records = await prisma.scope3Record.findMany({
      where: { companyId: DEMO_COMPANY_ID },
      include: { supplier: true, category: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(records);
  } catch (error) {
    console.error("Scope3 records GET error:", error);
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
      categoryId,
      supplierId,
      periodYear,
      valueTco2e,
      calculationMethod,
      emissionFactorSource,
      dataSource,
      assumptions,
      confidence,
      activityDataJson,
    } = body;

    if (
      !categoryId ||
      periodYear === undefined ||
      valueTco2e === undefined ||
      !calculationMethod ||
      !emissionFactorSource ||
      !dataSource ||
      confidence === undefined
    ) {
      return NextResponse.json(
        {
          error:
            "categoryId, periodYear, valueTco2e, calculationMethod, emissionFactorSource, dataSource, and confidence are required",
        },
        { status: 400 }
      );
    }

    const record = await prisma.scope3Record.create({
      data: {
        companyId: DEMO_COMPANY_ID,
        categoryId,
        supplierId: supplierId || null,
        periodYear: Number(periodYear),
        valueTco2e: Number(valueTco2e),
        calculationMethod,
        emissionFactorSource,
        dataSource,
        assumptions: assumptions || null,
        confidence: Number(confidence),
        activityDataJson: activityDataJson
          ? JSON.stringify(activityDataJson)
          : null,
      },
      include: { supplier: true, category: true },
    });

    await createAuditEvent(prisma, {
      entityType: "scope3",
      entityId: record.id,
      action: "created",
      actor: "user",
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Scope3 records POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
