import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import MethodologyClient from "./methodology-client";

// Force dynamic rendering — page requires database access at request time
export const dynamic = "force-dynamic";

export default async function MethodologyPage() {
  const notes = await prisma.methodologyNote.findMany({
    where: { companyId: DEMO_COMPANY_ID },
    orderBy: { scope: "asc" },
  });

  return <MethodologyClient initialNotes={notes} />;
}
