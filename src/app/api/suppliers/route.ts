import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import { logAuditEvent } from "@/lib/audit";
import { NextRequest, NextResponse } from "next/server";

// GET /api/suppliers - list all suppliers for demo company
export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { companyId: DEMO_COMPANY_ID },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ data: suppliers });
  } catch {
    return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 });
  }
}

// POST /api/suppliers - create a new supplier
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      name?: string;
      country?: string;
      sector?: string;
      contactEmail?: string;
      status?: string;
    };
    const { name, country, sector, contactEmail, status } = body;

    if (!name || !country || !sector || !contactEmail) {
      return NextResponse.json(
        { error: "Missing required fields: name, country, sector, contactEmail" },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.create({
      data: {
        id: crypto.randomUUID(),
        companyId: DEMO_COMPANY_ID,
        name,
        country,
        sector,
        contactEmail,
        publicFormToken: crypto.randomUUID(),
        status: (status as "active" | "inactive") ?? "active",
      },
    });

    await logAuditEvent({
      companyId: DEMO_COMPANY_ID,
      entityType: "supplier",
      entityId: supplier.id,
      action: "created",
      actor: "system",
      comment: `Supplier "${supplier.name}" created`,
    });

    return NextResponse.json({ data: supplier }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 });
  }
}
