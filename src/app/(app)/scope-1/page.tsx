import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import PageHeader from "@/components/layout/PageHeader";
import Scope1RecordTable from "@/components/scope1/Scope1RecordTable";

export const dynamic = "force-dynamic";

export default async function Scope1Page() {
  const records = await prisma.scope1Record.findMany({
    where: { companyId: DEMO_COMPANY_ID },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Scope 1 — Direct Emissions"
        description="Direct greenhouse gas emissions from sources owned or controlled by your organisation"
      />
      <Scope1RecordTable initialRecords={records} />
    </div>
  );
}
