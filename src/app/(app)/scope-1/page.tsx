import { prisma } from "@/lib/db";
import { DEMO_COMPANY_ID, DEMO_REPORTING_YEAR } from "@/lib/constants";
import { EmissionRecordsClient } from "@/app/(app)/emission-records-client";

export default async function Scope1Page() {
  const records = await prisma.scope1Record.findMany({
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
      apiPath="/api/scope1"
      title="Scope 1 Emissions"
      description="Direct emissions from owned or controlled sources"
      defaultYear={DEMO_REPORTING_YEAR}
    />
  );
}
