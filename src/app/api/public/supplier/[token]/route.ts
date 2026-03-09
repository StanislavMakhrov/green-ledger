import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import { resolveSupplierFormEmissions } from "@/lib/emissions";
import { createAuditEvent } from "@/lib/audit";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const supplier = await prisma.supplier.findUnique({ where: { publicFormToken: token } });
    if (!supplier || supplier.companyId !== DEMO_COMPANY_ID)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ supplierName: supplier.name, token });
  } catch (error) {
    console.error("Public supplier GET error:", error);
    return NextResponse.json({ error: "Failed to load supplier form" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const supplier = await prisma.supplier.findUnique({ where: { publicFormToken: token } });
    if (!supplier || supplier.companyId !== DEMO_COMPANY_ID)
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });

    const body = await request.json();
    const { spend_eur, ton_km, waste_kg, categoryId } = body;

    const [company, resolvedCategory] = await Promise.all([
      prisma.company.findUniqueOrThrow({ where: { id: DEMO_COMPANY_ID } }),
      categoryId
        ? prisma.scope3Category.findUniqueOrThrow({ where: { id: categoryId } })
        : prisma.scope3Category.findUniqueOrThrow({ where: { code: "C1" } }),
    ]);

    const emissions = resolveSupplierFormEmissions({ spend_eur, ton_km, waste_kg });
    if (!emissions) {
      return NextResponse.json({ error: "No valid activity data provided" }, { status: 400 });
    }

    const activityDataJson = JSON.stringify({ spend_eur, ton_km, waste_kg });

    const record = await prisma.scope3Record.create({
      data: {
        companyId: DEMO_COMPANY_ID,
        supplierId: supplier.id,
        categoryId: resolvedCategory.id,
        periodYear: company.reportingYear,
        valueTco2e: emissions.valueTco2e,
        calculationMethod: emissions.calculationMethod,
        emissionFactorSource: "Supplier form submission",
        dataSource: emissions.dataSource,
        assumptions: emissions.assumptions,
        confidence: emissions.confidence,
        activityDataJson,
      },
    });

    await createAuditEvent({
      companyId: DEMO_COMPANY_ID,
      entityType: "scope3",
      entityId: record.id,
      action: "submitted",
      actor: "supplier",
      comment: `Supplier form submitted by ${supplier.name}`,
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Public supplier POST error:", error);
    return NextResponse.json({ error: "Failed to submit supplier data" }, { status: 500 });
  }
}
