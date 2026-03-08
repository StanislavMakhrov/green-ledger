import { prisma } from "@/lib/db";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import { SuppliersClient } from "./suppliers-client";

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    where: { companyId: DEMO_COMPANY_ID },
    orderBy: { name: "asc" },
  });

  return <SuppliersClient initialSuppliers={suppliers} />;
}
