import { NextRequest, NextResponse } from "next/server";
import { getDemoCompany } from "@/lib/company";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "node:crypto";

/** GET /api/suppliers — list all suppliers for the demo company. */
export async function GET() {
  const company = await getDemoCompany();
  if (!company) {
    return NextResponse.json({ error: "No company found" }, { status: 404 });
  }
  const suppliers = await prisma.supplier.findMany({
    where: { companyId: company.id },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(suppliers);
}

/** POST /api/suppliers — create a new supplier with an auto-generated token. */
export async function POST(req: NextRequest) {
  const company = await getDemoCompany();
  if (!company) {
    return NextResponse.json({ error: "No company found" }, { status: 404 });
  }
  const body = await req.json();
  const supplier = await prisma.supplier.create({
    data: {
      companyId: company.id,
      name: body.name,
      country: body.country ?? "DE",
      sector: body.sector ?? "",
      contactEmail: body.contactEmail ?? "",
      publicFormToken: randomUUID(),
      status: "active",
    },
  });
  return NextResponse.json(supplier, { status: 201 });
}
