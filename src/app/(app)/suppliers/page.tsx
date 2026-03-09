import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import SuppliersClient from "./suppliers-client";

// Force dynamic rendering — page requires database access at request time
export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    where: { companyId: DEMO_COMPANY_ID },
    orderBy: { name: "asc" },
  });

  return <SuppliersClient initialSuppliers={suppliers} />;
}
