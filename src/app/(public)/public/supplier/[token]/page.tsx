import { prisma } from "@/lib/prisma";
import SupplierPublicForm from "@/components/public/SupplierPublicForm";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function PublicSupplierPage({ params }: Props) {
  const { token } = await params;

  const supplier = await prisma.supplier.findUnique({
    where: { publicFormToken: token },
  });

  if (!supplier || supplier.status !== "active") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Form Not Found
          </h1>
          <p className="text-gray-600 text-sm">
            This supplier form link is invalid, has expired, or has been
            deactivated.
          </p>
          <p className="text-gray-500 text-xs mt-3">
            If you believe this is an error, please contact the sustainability
            team.
          </p>
        </div>
      </div>
    );
  }

  const categories = await prisma.scope3Category.findMany({
    orderBy: { code: "asc" },
  });

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-lg w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🌿</span>
            <span className="font-bold text-gray-900">GreenLedger</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            Supplier Emissions Form
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Submitting for: <strong>{supplier.name}</strong>
          </p>
        </div>

        <SupplierPublicForm
          supplierName={supplier.name}
          categories={categories}
          token={token}
        />
      </div>
    </div>
  );
}
