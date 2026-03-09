import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";

export async function GET() {
  const notes = await prisma.methodologyNote.findMany({
    where: { companyId: DEMO_COMPANY_ID },
    orderBy: { scope: "asc" },
  });
  return NextResponse.json(notes);
}

export async function PUT(request: NextRequest) {
  const body = (await request.json()) as {
    scope: string;
    text: string;
  };

  const note = await prisma.methodologyNote.upsert({
    where: {
      companyId_scope: { companyId: DEMO_COMPANY_ID, scope: body.scope },
    },
    update: { text: body.text },
    create: {
      companyId: DEMO_COMPANY_ID,
      scope: body.scope,
      text: body.text,
    },
  });

  await prisma.auditTrailEvent.create({
    data: {
      companyId: DEMO_COMPANY_ID,
      entityType: "methodology",
      entityId: note.id,
      action: "updated",
      actor: "user",
    },
  });

  return NextResponse.json(note);
}
