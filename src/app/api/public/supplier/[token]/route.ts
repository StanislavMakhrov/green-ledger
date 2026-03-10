import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import { calculateProxyEmissions } from "@/lib/calculations";
import { NextRequest, NextResponse } from "next/server";

// POST /api/public/supplier/[token]
// Body: { spend_eur?: number, ton_km?: number, waste_kg?: number, periodYear?: number }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await req.json() as {
      spend_eur?: number;
      ton_km?: number;
      waste_kg?: number;
      periodYear?: number;
    };
    const { spend_eur, ton_km, waste_kg, periodYear } = body;

    // Validate at least one activity input > 0
    const hasValidInput =
      (spend_eur !== undefined && spend_eur > 0) ||
      (ton_km !== undefined && ton_km > 0) ||
      (waste_kg !== undefined && waste_kg > 0);

    if (!hasValidInput) {
      return NextResponse.json(
        { error: "At least one of spend_eur, ton_km, or waste_kg must be greater than 0" },
        { status: 400 }
      );
    }

    // Look up supplier by public form token
    const supplier = await prisma.supplier.findUnique({
      where: { publicFormToken: token },
    });

    if (!supplier) {
      return NextResponse.json({ error: "Invalid or expired form link" }, { status: 404 });
    }

    // Calculate emissions
    const calculation = calculateProxyEmissions({ spend_eur, ton_km, waste_kg });

    // Default to current reporting year if not supplied
    const company = await prisma.company.findUnique({
      where: { id: DEMO_COMPANY_ID },
    });
    const year = periodYear ?? company?.reportingYear ?? new Date().getFullYear();

    // Find default C1 category (Purchased goods and services)
    const category = await prisma.scope3Category.findFirst({
      where: { code: "C1" },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Scope 3 category C1 not found. Please ensure seed data is loaded." },
        { status: 500 }
      );
    }

    // Capture activity data for traceability
    const activityDataJson = JSON.stringify({ spend_eur, ton_km, waste_kg });

    // Create Scope3Record + AuditTrailEvent in a transaction
    await prisma.$transaction(async (tx) => {
      const record = await tx.scope3Record.create({
        data: {
          id: crypto.randomUUID(),
          companyId: DEMO_COMPANY_ID,
          supplierId: supplier.id,
          categoryId: category.id,
          periodYear: year,
          valueTco2e: calculation.valueTco2e,
          calculationMethod: calculation.calculationMethod,
          emissionFactorSource: calculation.emissionFactorSource,
          dataSource: "supplier_form",
          assumptions: calculation.assumptions,
          confidence: calculation.confidence,
          activityDataJson,
        },
      });

      await tx.auditTrailEvent.create({
        data: {
          id: crypto.randomUUID(),
          companyId: DEMO_COMPANY_ID,
          entityType: "scope3",
          entityId: record.id,
          action: "submitted",
          actor: `supplier:${supplier.id}`,
          comment: `Supplier "${supplier.name}" submitted emission data via public form`,
          timestamp: new Date(),
        },
      });
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    if (error instanceof Error && error.message === "No valid activity data provided") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to process supplier submission" }, { status: 500 });
  }
}
