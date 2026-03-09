import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import PageHeader from "@/components/layout/PageHeader";
import MethodologyEditor from "@/components/methodology/MethodologyEditor";

export const dynamic = "force-dynamic";

export default async function MethodologyPage() {
  const notes = await prisma.methodologyNote.findMany({
    where: { companyId: DEMO_COMPANY_ID },
    orderBy: { scope: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Methodology Notes"
        description="Document the methodologies, assumptions, and data sources used for each emission scope"
      />
      <MethodologyEditor initialNotes={notes} />
    </div>
  );
}
