import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateProxy } from "@/lib/calculations";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supplier = await prisma.supplier.findUnique({
    where: { publicFormToken: token },
  });
  if (!supplier || supplier.status === "inactive") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    id: supplier.id,
    name: supplier.name,
    sector: supplier.sector,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supplier = await prisma.supplier.findUnique({
    where: { publicFormToken: token },
  });
  if (!supplier || supplier.status === "inactive") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    spend_eur?: number;
    ton_km?: number;
    waste_kg?: number;
    categoryId?: string;
    periodYear?: number;
  };

  const hasActivity =
    (body.spend_eur !== undefined && body.spend_eur > 0) ||
    (body.ton_km !== undefined && body.ton_km > 0) ||
    (body.waste_kg !== undefined && body.waste_kg > 0);

  if (!hasActivity) {
    return NextResponse.json(
      { error: "At least one activity field (spend_eur, ton_km, waste_kg) with a positive value is required" },
      { status: 400 }
    );
  }

  const company = await prisma.company.findUnique({
    where: { id: supplier.companyId },
  });
  const periodYear = body.periodYear ?? company?.reportingYear ?? new Date().getFullYear();

  let categoryId = body.categoryId;
  if (!categoryId) {
    const defaultCat = await prisma.scope3Category.findFirst({
      where: { code: "C1" },
    });
    categoryId = defaultCat?.id;
  }
  if (!categoryId) {
    return NextResponse.json({ error: "No default category found" }, { status: 500 });
  }

  const activityData = {
    ...(body.spend_eur !== undefined && { spend_eur: body.spend_eur }),
    ...(body.ton_km !== undefined && { ton_km: body.ton_km }),
    ...(body.waste_kg !== undefined && { waste_kg: body.waste_kg }),
  };

  const proxy = calculateProxy(activityData);

  const record = await prisma.scope3Record.create({
    data: {
      companyId: supplier.companyId,
      supplierId: supplier.id,
      categoryId,
      periodYear,
      valueTco2e: proxy.valueTco2e,
      calculationMethod: proxy.calculationMethod,
      emissionFactorSource: proxy.emissionFactorSource,
      dataSource: proxy.dataSource,
      assumptions: proxy.assumptions,
      confidence: proxy.confidence,
      activityDataJson: JSON.stringify(activityData),
    },
  });

  await prisma.auditTrailEvent.create({
    data: {
      companyId: supplier.companyId,
      entityType: "scope3",
      entityId: record.id,
      action: "submitted",
      actor: "supplier",
      comment: `Supplier form submission by ${supplier.name}`,
    },
  });

  return NextResponse.json(
    { success: true, recordId: record.id, valueTco2e: record.valueTco2e },
    { status: 201 }
  );
}
