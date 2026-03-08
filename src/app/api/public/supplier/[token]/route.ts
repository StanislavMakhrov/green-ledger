import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  PROXY_FACTOR_PER_EUR,
  DEFAULT_SCOPE3_CATEGORY_CODE,
} from "@/lib/constants";

/** Emission factor for transport (tCO2e per tonne-km). Source: DEFRA 2023 */
const EF_TON_KM = 0.0001;

/** Emission factor for waste (tCO2e per kg). Source: DEFRA 2023 */
const EF_WASTE_KG = 0.00058;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supplier = await prisma.supplier.findUnique({
    where: { publicFormToken: token },
    select: { name: true, sector: true, country: true },
  });

  if (!supplier) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(supplier);
}

interface SubmissionBody {
  spend_eur?: number;
  ton_km?: number;
  waste_kg?: number;
  notes?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supplier = await prisma.supplier.findUnique({
    where: { publicFormToken: token },
    include: { company: { select: { id: true, reportingYear: true } } },
  });

  if (!supplier) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as SubmissionBody;

  // Validate inputs: at least one data type must be provided with a positive value
  const hasSpend =
    body.spend_eur !== undefined &&
    typeof body.spend_eur === "number" &&
    body.spend_eur >= 0;
  const hasTonKm =
    body.ton_km !== undefined &&
    typeof body.ton_km === "number" &&
    body.ton_km >= 0;
  const hasWaste =
    body.waste_kg !== undefined &&
    typeof body.waste_kg === "number" &&
    body.waste_kg >= 0;

  if (!hasSpend && !hasTonKm && !hasWaste) {
    return NextResponse.json(
      { error: "Provide at least one of: spend_eur, ton_km, waste_kg" },
      { status: 400 }
    );
  }

  // Find default category
  const category = await prisma.scope3Category.findFirst({
    where: { code: DEFAULT_SCOPE3_CATEGORY_CODE },
    select: { id: true },
  });

  if (!category) {
    return NextResponse.json(
      { error: "Category not configured" },
      { status: 500 }
    );
  }

  let valueTco2e: number;
  let calculationMethod: string;
  let emissionFactorSource: string;
  let confidence: number;

  if (body.spend_eur !== undefined) {
    valueTco2e = body.spend_eur * PROXY_FACTOR_PER_EUR;
    calculationMethod = "spend_based";
    emissionFactorSource = "DEFRA 2023 spend-based proxy";
    confidence = 0.6;
  } else if (body.ton_km !== undefined) {
    valueTco2e = body.ton_km * EF_TON_KM;
    calculationMethod = "activity_based";
    emissionFactorSource = "DEFRA 2023 transport activity";
    confidence = 0.8;
  } else if (body.waste_kg !== undefined) {
    valueTco2e = body.waste_kg * EF_WASTE_KG;
    calculationMethod = "activity_based";
    emissionFactorSource = "DEFRA 2023 waste proxy";
    confidence = 0.8;
  } else {
    return NextResponse.json({ error: "No data provided" }, { status: 400 });
  }

  const assumptions =
    body.notes ??
    `Auto-calculated from supplier submission via ${calculationMethod} method.`;

  const record = await prisma.scope3Record.create({
    data: {
      companyId: supplier.company.id,
      supplierId: supplier.id,
      categoryId: category.id,
      periodYear: supplier.company.reportingYear,
      valueTco2e,
      calculationMethod,
      emissionFactorSource,
      dataSource: "supplier_form",
      assumptions,
      confidence,
      activityDataJson: JSON.stringify({
        spend_eur: body.spend_eur,
        ton_km: body.ton_km,
        waste_kg: body.waste_kg,
      }),
    },
  });

  await prisma.auditTrailEvent.create({
    data: {
      companyId: supplier.company.id,
      entityType: "scope3",
      entityId: record.id,
      action: "submitted",
      actor: "supplier",
      comment: `Supplier ${supplier.name} submitted ${calculationMethod} data`,
    },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
