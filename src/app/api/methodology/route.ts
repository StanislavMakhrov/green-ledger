import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import { createAuditEvent } from "@/lib/audit";

export async function GET() {
  const notes = await prisma.methodologyNote.findMany({
    where: { companyId: DEMO_COMPANY_ID },
    orderBy: { scope: "asc" },
  });
  return NextResponse.json(notes);
}

export async function PUT(request: Request) {
  const body = (await request.json()) as Array<{
    scope: string;
    text: string;
  }>;

  const updated = await Promise.all(
    body.map(async (note) => {
      const existing = await prisma.methodologyNote.findFirst({
        where: { companyId: DEMO_COMPANY_ID, scope: note.scope },
      });

      if (existing) {
        return prisma.methodologyNote.update({
          where: { id: existing.id },
          data: { text: note.text },
        });
      }

      return prisma.methodologyNote.create({
        data: { companyId: DEMO_COMPANY_ID, scope: note.scope, text: note.text },
      });
    }),
  );

  await createAuditEvent({
    companyId: DEMO_COMPANY_ID,
    entityType: "methodology",
    entityId: DEMO_COMPANY_ID,
    action: "updated",
    actor: "user",
  });

  return NextResponse.json(updated);
}
