import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEMO_COMPANY_ID } from "@/lib/constants";

export async function GET() {
  const notes = await prisma.methodologyNote.findMany({
    where: { companyId: DEMO_COMPANY_ID },
  });
  return NextResponse.json(notes);
}

export async function PUT(request: NextRequest) {
  const body = (await request.json()) as {
    scope: string;
    text: string;
  };

  const VALID_SCOPES = ["scope_1", "scope_2", "scope_3"];
  if (!VALID_SCOPES.includes(body.scope)) {
    return NextResponse.json(
      { error: "Invalid scope. Must be scope_1, scope_2, or scope_3." },
      { status: 400 }
    );
  }

  if (typeof body.text !== "string") {
    return NextResponse.json({ error: "text must be a string" }, { status: 400 });
  }

  const existing = await prisma.methodologyNote.findFirst({
    where: { companyId: DEMO_COMPANY_ID, scope: body.scope },
    select: { id: true },
  });

  let note;
  if (existing) {
    note = await prisma.methodologyNote.update({
      where: { id: existing.id },
      data: { text: body.text },
    });
  } else {
    note = await prisma.methodologyNote.create({
      data: {
        companyId: DEMO_COMPANY_ID,
        scope: body.scope,
        text: body.text,
      },
    });
  }

  return NextResponse.json(note);
}
