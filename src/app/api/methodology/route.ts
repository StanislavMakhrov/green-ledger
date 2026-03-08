import { NextRequest, NextResponse } from "next/server";
import { getDemoCompany } from "@/lib/company";
import { prisma } from "@/lib/prisma";

/** GET /api/methodology — list methodology notes for the demo company. */
export async function GET() {
  const company = await getDemoCompany();
  if (!company) {
    return NextResponse.json({ error: "No company found" }, { status: 404 });
  }
  const notes = await prisma.methodologyNote.findMany({
    where: { companyId: company.id },
  });
  return NextResponse.json(notes);
}

/** PUT /api/methodology — upsert a methodology note by scope. */
export async function PUT(req: NextRequest) {
  const company = await getDemoCompany();
  if (!company) {
    return NextResponse.json({ error: "No company found" }, { status: 404 });
  }
  const body = await req.json();
  const { scope, text } = body as { scope: string; text: string };

  const existing = await prisma.methodologyNote.findFirst({
    where: { companyId: company.id, scope },
  });

  let note;
  if (existing) {
    note = await prisma.methodologyNote.update({
      where: { id: existing.id },
      data: { text },
    });
  } else {
    note = await prisma.methodologyNote.create({
      data: { companyId: company.id, scope, text },
    });
  }
  return NextResponse.json(note);
}
