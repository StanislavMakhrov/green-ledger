import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import { logAuditEvent } from "@/lib/audit";
import { NextRequest, NextResponse } from "next/server";

// GET /api/scope3/records - list scope 3 records for demo company
export async function GET() {
  try {
    const company = await prisma.company.findUnique({
      where: { id: DEMO_COMPANY_ID },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const records = await prisma.scope3Record.findMany({
      where: { companyId: DEMO_COMPANY_ID, periodYear: company.reportingYear },
      include: { category: true, supplier: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: records });
  } catch {
    return NextResponse.json({ error: "Failed to fetch scope 3 records" }, { status: 500 });
  }
}

// POST /api/scope3/records - create a scope 3 record
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      categoryId?: string;
      supplierId?: string;
      periodYear?: number;
      valueTco2e?: number;
      calculationMethod?: string;
      emissionFactorSource?: string;
      dataSource?: string;
      assumptions?: string;
      confidence?: number;
      activityDataJson?: string;
    };
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
        { error: "Missing required fields: categoryId, periodYear, valueTco2e, calculationMethod, emissionFactorSource, dataSource, confidence" },
        { status: 400 }
      );
    }

    const record = await prisma.scope3Record.create({
      data: {
        id: crypto.randomUUID(),
        companyId: DEMO_COMPANY_ID,
        categoryId,
        supplierId: supplierId ?? null,
        periodYear,
        valueTco2e,
        calculationMethod: calculationMethod as "spend_based" | "activity_based" | "supplier_specific",
        emissionFactorSource,
        dataSource: dataSource as "supplier_form" | "csv_import" | "proxy",
        assumptions: assumptions ?? null,
        confidence,
        activityDataJson: activityDataJson ?? null,
      },
    });

    await logAuditEvent({
      companyId: DEMO_COMPANY_ID,
      entityType: "scope3",
      entityId: record.id,
      action: "created",
      actor: "system",
      comment: `Scope 3 record created: ${valueTco2e} tCO₂e`,
    });

    return NextResponse.json({ data: record }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create scope 3 record" }, { status: 500 });
  }
}
