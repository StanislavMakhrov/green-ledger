import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import Scope1Client from "./scope1-client";

// Force dynamic rendering — page requires database access at request time
export const dynamic = "force-dynamic";

export default async function Scope1Page() {
  const company = await prisma.company.findUnique({
    where: { id: DEMO_COMPANY_ID },
  });
  const records = await prisma.scope1Record.findMany({
    where: {
      companyId: DEMO_COMPANY_ID,
      periodYear: company?.reportingYear,
    },
    orderBy: { createdAt: "desc" },
  });

  // Serialize Date to ISO string for client component props
  return (
    <Scope1Client
      reportingYear={company?.reportingYear ?? new Date().getFullYear()}
      initialRecords={records.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      }))}
    />
  );
}
