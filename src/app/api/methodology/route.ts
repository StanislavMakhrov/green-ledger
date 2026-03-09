import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import { createAuditEvent } from "@/lib/audit";

export async function GET() {
  const notes = await prisma.methodologyNote.findMany({ where: { companyId: DEMO_COMPANY_ID } });
  return NextResponse.json(notes);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { scope, text } = body;
  const validScopes = ["scope_1", "scope_2", "scope_3"];
  if (!scope || !validScopes.includes(scope))
    return NextResponse.json({ error: "Invalid or missing scope" }, { status: 400 });
  const note = await prisma.methodologyNote.upsert({
    where: { companyId_scope: { companyId: DEMO_COMPANY_ID, scope } },
    update: { text },
    create: { companyId: DEMO_COMPANY_ID, scope, text },
  });
  await createAuditEvent({ companyId: DEMO_COMPANY_ID, entityType: "methodology", entityId: note.id, action: "updated", actor: "user" });
  return NextResponse.json(note);
}
