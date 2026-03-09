import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/audit";
import { DEMO_COMPANY_ID } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { companyId: DEMO_COMPANY_ID },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(suppliers);
  } catch (error) {
    console.error("Suppliers GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, country, sector, contactEmail } = body;

    if (!name || !country || !sector || !contactEmail) {
      return NextResponse.json(
        { error: "name, country, sector, and contactEmail are required" },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.create({
      data: {
        companyId: DEMO_COMPANY_ID,
        name,
        country,
        sector,
        contactEmail,
        publicFormToken: crypto.randomUUID(),
        status: "active",
      },
    });

    await createAuditEvent(prisma, {
      entityType: "supplier",
      entityId: supplier.id,
      action: "created",
      actor: "user",
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.error("Suppliers POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
