import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import { NextRequest, NextResponse } from "next/server";

// PUT /api/methodology/[scope] - upsert methodology note by scope
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ scope: string }> }
) {
  try {
    const { scope } = await params;
    const body = await req.json() as { text?: string };
    const { text } = body;

    if (!text) {
      return NextResponse.json({ error: "Missing required field: text" }, { status: 400 });
    }

    const validScopes = ["scope_1", "scope_2", "scope_3"];
    if (!validScopes.includes(scope)) {
      return NextResponse.json(
        { error: `Invalid scope. Must be one of: ${validScopes.join(", ")}` },
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
        id: crypto.randomUUID(),
        companyId: DEMO_COMPANY_ID,
        scope: scope as "scope_1" | "scope_2" | "scope_3",
        text,
      },
    });

    return NextResponse.json({ data: note });
  } catch {
    return NextResponse.json({ error: "Failed to update methodology note" }, { status: 500 });
  }
}
