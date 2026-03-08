import { prisma } from "@/lib/db";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import { MethodologyClient } from "./methodology-client";

export default async function MethodologyPage() {
  const notes = await prisma.methodologyNote.findMany({
    where: { companyId: DEMO_COMPANY_ID },
  });

  return <MethodologyClient initialNotes={notes} />;
}
