import { prisma } from "@/lib/db";
import { DEMO_COMPANY_ID, DEMO_REPORTING_YEAR } from "@/lib/constants";
import { EmissionRecordsClient } from "@/app/(app)/emission-records-client";

export default async function Scope2Page() {
  const records = await prisma.scope2Record.findMany({
    where: { companyId: DEMO_COMPANY_ID, periodYear: DEMO_REPORTING_YEAR },
    orderBy: { createdAt: "desc" },
  });

  const serialized = records.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <EmissionRecordsClient
      initialRecords={serialized}
      apiPath="/api/scope2"
      title="Scope 2 Emissions"
      description="Indirect emissions from purchased energy"
      defaultYear={DEMO_REPORTING_YEAR}
    />
  );
}
