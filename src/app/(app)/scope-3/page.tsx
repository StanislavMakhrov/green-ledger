import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import PageHeader from "@/components/layout/PageHeader";
import CategoryList from "@/components/scope3/CategoryList";
import Scope3RecordTable from "@/components/scope3/Scope3RecordTable";

export const dynamic = "force-dynamic";

export default async function Scope3Page() {
  const [categories, records, suppliers] = await Promise.all([
    prisma.scope3Category.findMany({ orderBy: { code: "asc" } }),
    prisma.scope3Record.findMany({
      where: { companyId: DEMO_COMPANY_ID },
      include: { supplier: true, category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.supplier.findMany({
      where: { companyId: DEMO_COMPANY_ID },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Scope 3 — Value Chain Emissions"
        description="Supply chain emissions from purchased goods, logistics, business travel, and more"
      />

      <h2 className="text-lg font-semibold text-gray-800 mb-3">
        Categories (ESRS E1)
      </h2>
      <CategoryList initialCategories={categories} />

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Records</h2>
        <Scope3RecordTable
          initialRecords={records}
          categories={categories}
          suppliers={suppliers}
        />
      </div>
    </div>
  );
}
