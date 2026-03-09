import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import { calculateProxyEmissions } from "@/lib/emissions";
import { createAuditEvent } from "@/lib/audit";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supplier = await prisma.supplier.findUnique({ where: { publicFormToken: token } });
  if (!supplier || supplier.companyId !== DEMO_COMPANY_ID)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ supplierName: supplier.name, token });
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supplier = await prisma.supplier.findUnique({ where: { publicFormToken: token } });
  if (!supplier || supplier.companyId !== DEMO_COMPANY_ID)
    return NextResponse.json({ error: "Supplier not found" }, { status: 404 });

  const body = await request.json();
  const { spend_eur, ton_km, waste_kg, categoryId } = body;

  const company = await prisma.company.findUniqueOrThrow({ where: { id: DEMO_COMPANY_ID } });

  let resolvedCategoryId = categoryId;
  if (!resolvedCategoryId) {
    const defaultCat = await prisma.scope3Category.findUniqueOrThrow({ where: { code: "C1" } });
    resolvedCategoryId = defaultCat.id;
  }

  let valueTco2e = 0;
  let calculationMethod = "spend_based";
  let assumptions = "";
  let confidence = 1.0;
  let dataSource = "supplier_form";

  const activityDataJson = JSON.stringify({ spend_eur, ton_km, waste_kg });

  if (spend_eur != null && Number(spend_eur) > 0) {
    const result = calculateProxyEmissions({ spend_eur: Number(spend_eur) });
    valueTco2e = result.valueTco2e;
    calculationMethod = result.calculationMethod;
    assumptions = result.assumptions;
    confidence = result.confidence;
    dataSource = result.dataSource;
  } else if (ton_km != null && Number(ton_km) > 0) {
    valueTco2e = Number(ton_km) * 0.0001;
    calculationMethod = "activity_based";
    assumptions = `Transport activity data: ${ton_km} ton-km at 0.1 kgCO₂e/ton-km`;
    confidence = 0.7;
  } else if (waste_kg != null && Number(waste_kg) > 0) {
    valueTco2e = Number(waste_kg) * 0.001;
    calculationMethod = "activity_based";
    assumptions = `Waste data: ${waste_kg} kg at 1 kgCO₂e/kg`;
    confidence = 0.5;
  } else {
    return NextResponse.json({ error: "No valid activity data provided" }, { status: 400 });
  }

  const record = await prisma.scope3Record.create({
    data: {
      companyId: DEMO_COMPANY_ID,
      supplierId: supplier.id,
      categoryId: resolvedCategoryId,
      periodYear: company.reportingYear,
      valueTco2e,
      calculationMethod,
      emissionFactorSource: "Supplier form submission",
      dataSource,
      assumptions,
      confidence,
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
}
