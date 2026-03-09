import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import PageHeader from "@/components/layout/PageHeader";
import SupplierTable from "@/components/suppliers/SupplierTable";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    where: { companyId: DEMO_COMPANY_ID },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Suppliers"
        description="Manage your supplier list and collect emissions data via tokenized forms"
      />
      <SupplierTable initialSuppliers={suppliers} />
    </div>
  );
}
