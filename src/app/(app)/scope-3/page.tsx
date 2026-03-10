import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import Scope3Client from "./scope3-client";

// Force dynamic rendering — page requires database access at request time
export const dynamic = "force-dynamic";

export default async function Scope3Page() {
  const company = await prisma.company.findUnique({
    where: { id: DEMO_COMPANY_ID },
  });

  const [categories, records] = await Promise.all([
    prisma.scope3Category.findMany({ orderBy: { code: "asc" } }),
    prisma.scope3Record.findMany({
      where: {
        companyId: DEMO_COMPANY_ID,
        periodYear: company?.reportingYear,
      },
      include: { category: true, supplier: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <Scope3Client
      reportingYear={company?.reportingYear ?? new Date().getFullYear()}
      initialCategories={categories}
      initialRecords={records}
    />
  );
}
