import { prisma } from "@/lib/db";
import { DEMO_COMPANY_ID, DEMO_REPORTING_YEAR } from "@/lib/constants";
import { Scope3Client } from "./scope3-client";

export default async function Scope3Page() {
  const [categories, records] = await Promise.all([
    prisma.scope3Category.findMany({ orderBy: { code: "asc" } }),
    prisma.scope3Record.findMany({
      where: { companyId: DEMO_COMPANY_ID, periodYear: DEMO_REPORTING_YEAR },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const serializedRecords = records.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <Scope3Client
      initialCategories={categories}
      initialRecords={serializedRecords}
      defaultYear={DEMO_REPORTING_YEAR}
    />
  );
}
