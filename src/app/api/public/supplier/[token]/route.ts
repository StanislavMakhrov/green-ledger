import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/audit";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import {
  calculateProxyTco2e,
  buildProxyAssumptions,
  getProxyConfidence,
  getProxyCalculationMethod,
  buildActivityDataJson,
} from "@/lib/proxy";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supplier = await prisma.supplier.findUnique({
      where: { publicFormToken: token },
    });

    if (!supplier || supplier.status !== "active") {
      return NextResponse.json(
        { error: "Form not found or no longer active" },
        { status: 404 }
      );
    }

    const categories = await prisma.scope3Category.findMany({
      orderBy: { code: "asc" },
    });

    return NextResponse.json({
      supplierName: supplier.name,
      categories,
    });
  } catch (error) {
    console.error("Public supplier GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supplier = await prisma.supplier.findUnique({
      where: { publicFormToken: token },
    });

    if (!supplier || supplier.status !== "active") {
      return NextResponse.json(
        { error: "Form not found or no longer active" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { categoryId, spend_eur, ton_km, waste_kg } = body;

    if (!categoryId) {
      return NextResponse.json(
        { error: "categoryId is required" },
        { status: 400 }
      );
    }

    if (
      spend_eur === undefined &&
      ton_km === undefined &&
      waste_kg === undefined
    ) {
      return NextResponse.json(
        { error: "At least one of spend_eur, ton_km, or waste_kg is required" },
        { status: 400 }
      );
    }

    const category = await prisma.scope3Category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const company = await prisma.company.findUniqueOrThrow({
      where: { id: DEMO_COMPANY_ID },
    });

    const proxyInput = { spend_eur, ton_km, waste_kg };
    const valueTco2e = calculateProxyTco2e(proxyInput);
    const assumptions = buildProxyAssumptions(proxyInput);
    const confidence = getProxyConfidence(proxyInput);
    const calculationMethod = getProxyCalculationMethod(proxyInput);
    const activityData = buildActivityDataJson(proxyInput);

    const record = await prisma.scope3Record.create({
      data: {
        companyId: DEMO_COMPANY_ID,
        supplierId: supplier.id,
        categoryId,
        periodYear: company.reportingYear,
        valueTco2e,
        calculationMethod: calculationMethod as
          | "spend_based"
          | "activity_based"
          | "supplier_specific",
        emissionFactorSource: "DEFRA 2023 proxy factors (demo placeholder)",
        dataSource: "supplier_form",
        assumptions,
        confidence,
        activityDataJson: JSON.stringify(activityData),
      },
      include: { supplier: true, category: true },
    });

    await createAuditEvent(prisma, {
      companyId: DEMO_COMPANY_ID,
      entityType: "scope3",
      entityId: record.id,
      action: "submitted",
      actor: "supplier",
      comment: `Supplier form submission from ${supplier.name}`,
    });

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error("Public supplier POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
