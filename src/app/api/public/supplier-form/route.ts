import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/audit";
import { PROXY_FACTOR, PROXY_FACTOR_SOURCE, TON_KM_FACTOR, WASTE_KG_FACTOR } from "@/lib/constants";

/**
 * POST /api/public/supplier-form
 * Accepts submission from the public supplier data-entry form.
 * Finds the supplier by publicFormToken, calculates tCO₂e, and creates a Scope3Record.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { token, categoryId, spendEur, tonKm, wasteKg, notes } = body as {
    token: string;
    categoryId: string;
    spendEur?: number;
    tonKm?: number;
    wasteKg?: number;
    notes?: string;
  };

  const supplier = await prisma.supplier.findUnique({
    where: { publicFormToken: token },
    include: { company: true },
  });

  if (!supplier) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  }

  // Find default category if none provided
  let resolvedCategoryId = categoryId;
  if (!resolvedCategoryId) {
    const c1 = await prisma.scope3Category.findFirst({ where: { code: "C1" } });
    if (!c1) {
      return NextResponse.json(
        { error: "No Scope 3 categories seeded" },
        { status: 500 }
      );
    }
    resolvedCategoryId = c1.id;
  }

  // Calculate tCO₂e based on provided activity data
  let valueTco2e = 0;
  let calculationMethod = "spend_based";
  let assumptions = `Spend-based proxy using ${PROXY_FACTOR_SOURCE}`;

  if (spendEur !== undefined && spendEur !== null) {
    valueTco2e = spendEur * PROXY_FACTOR;
    calculationMethod = "spend_based";
  } else if (tonKm !== undefined && tonKm !== null) {
    // GLEC Framework 2023 default road freight factor
    valueTco2e = tonKm * TON_KM_FACTOR;
    calculationMethod = "activity_based";
    assumptions = "Activity-based: road freight (GLEC Framework 2023 default)";
  } else if (wasteKg !== undefined && wasteKg !== null) {
    // DEFRA 2023 mixed waste factor
    valueTco2e = wasteKg * WASTE_KG_FACTOR;
    calculationMethod = "activity_based";
    assumptions = "Activity-based: mixed waste (DEFRA 2023)";
  }

  const activityData = { spendEur, tonKm, wasteKg, notes };

  const record = await prisma.scope3Record.create({
    data: {
      companyId: supplier.companyId,
      supplierId: supplier.id,
      categoryId: resolvedCategoryId,
      periodYear: supplier.company.reportingYear,
      valueTco2e,
      calculationMethod,
      emissionFactorSource: PROXY_FACTOR_SOURCE,
      dataSource: "supplier_form",
      assumptions,
      confidence: 0.7,
      activityDataJson: JSON.stringify(activityData),
    },
  });

  await createAuditEvent({
    companyId: supplier.companyId,
    entityType: "scope3",
    entityId: record.id,
    action: "submitted",
    actor: "supplier",
    comment: `Submitted by supplier ${supplier.name}`,
  });

  return NextResponse.json({ success: true, recordId: record.id }, { status: 201 });
}
