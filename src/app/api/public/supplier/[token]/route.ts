import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  PROXY_FACTOR,
  TON_KM_FACTOR,
  WASTE_KG_FACTOR,
  CONFIDENCE_SPEND,
  CONFIDENCE_TON_KM,
  CONFIDENCE_WASTE_KG,
  DEFAULT_SUPPLIER_CATEGORY_CODE,
  DEMO_COMPANY_ID,
} from "@/lib/constants";
import { createAuditEvent } from "@/lib/audit";

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { token } = await params;

  const supplier = await prisma.supplier.findUnique({
    where: { publicFormToken: token },
    include: { company: { select: { name: true, reportingYear: true } } },
  });

  if (!supplier || supplier.status !== "active") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    supplierName: supplier.name,
    companyName: supplier.company.name,
    reportingYear: supplier.company.reportingYear,
  });
}

export async function POST(request: Request, { params }: RouteParams) {
  const { token } = await params;

  const supplier = await prisma.supplier.findUnique({
    where: { publicFormToken: token },
    include: { company: true },
  });

  if (!supplier || supplier.status !== "active") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    spend_eur?: number;
    ton_km?: number;
    waste_kg?: number;
  };

  const hasAtLeastOne =
    body.spend_eur != null || body.ton_km != null || body.waste_kg != null;

  if (!hasAtLeastOne) {
    return NextResponse.json(
      { error: "At least one value (spend_eur, ton_km, waste_kg) is required" },
      { status: 400 },
    );
  }

  // Find the default category (C1)
  const category = await prisma.scope3Category.findFirst({
    where: { code: DEFAULT_SUPPLIER_CATEGORY_CODE },
  });

  if (!category) {
    return NextResponse.json(
      { error: "Default category not found" },
      { status: 500 },
    );
  }

  let valueTco2e: number;
  let confidence: number;
  let calculationMethod: string;
  let activityDataJson: string;

  if (body.spend_eur != null) {
    valueTco2e = body.spend_eur * PROXY_FACTOR;
    confidence = CONFIDENCE_SPEND;
    calculationMethod = "spend_based";
    activityDataJson = JSON.stringify({ spend_eur: body.spend_eur });
  } else if (body.ton_km != null) {
    valueTco2e = body.ton_km * TON_KM_FACTOR;
    confidence = CONFIDENCE_TON_KM;
    calculationMethod = "activity_based";
    activityDataJson = JSON.stringify({ ton_km: body.ton_km });
  } else {
    // waste_kg
    valueTco2e = (body.waste_kg ?? 0) * WASTE_KG_FACTOR;
    confidence = CONFIDENCE_WASTE_KG;
    calculationMethod = "activity_based";
    activityDataJson = JSON.stringify({ waste_kg: body.waste_kg });
  }

  const record = await prisma.scope3Record.create({
    data: {
      companyId: supplier.companyId,
      supplierId: supplier.id,
      categoryId: category.id,
      periodYear: supplier.company.reportingYear,
      valueTco2e,
      calculationMethod,
      emissionFactorSource: "DEFRA 2023 / EEIO proxy",
      dataSource: "supplier_form",
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
    comment: `Supplier ${supplier.name} submitted form data`,
  });

  return NextResponse.json({ success: true, recordId: record.id }, { status: 201 });
}
