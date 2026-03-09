import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import PageHeader from "@/components/layout/PageHeader";
import Scope2RecordTable from "@/components/scope2/Scope2RecordTable";

export const dynamic = "force-dynamic";

export default async function Scope2Page() {
  const records = await prisma.scope2Record.findMany({
    where: { companyId: DEMO_COMPANY_ID },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Scope 2 — Indirect Energy Emissions"
        description="Indirect emissions from the generation of purchased electricity, steam, heat, and cooling"
      />
      <Scope2RecordTable initialRecords={records} />
    </div>
  );
}
