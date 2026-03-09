import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/audit";
import { DEMO_COMPANY_ID } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ scope: string }> }
) {
  try {
    const { scope } = await params;
    const validScopes = ["scope_1", "scope_2", "scope_3"];

    if (!validScopes.includes(scope)) {
      return NextResponse.json(
        { error: "Invalid scope. Must be scope_1, scope_2, or scope_3" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { text } = body;

    if (text === undefined) {
      return NextResponse.json(
        { error: "text is required" },
        { status: 400 }
      );
    }

    const note = await prisma.methodologyNote.upsert({
      where: {
        companyId_scope: {
          companyId: DEMO_COMPANY_ID,
          scope: scope as "scope_1" | "scope_2" | "scope_3",
        },
      },
      update: { text },
      create: {
        companyId: DEMO_COMPANY_ID,
        scope: scope as "scope_1" | "scope_2" | "scope_3",
        text,
      },
    });

    await createAuditEvent(prisma, {
      entityType: "methodology",
      entityId: note.id,
      action: "updated",
      actor: "user",
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error("Methodology PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
