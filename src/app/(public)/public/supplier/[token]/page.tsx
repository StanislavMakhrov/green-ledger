import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import SupplierFormClient from "./supplier-form-client";

// Force dynamic rendering — page requires database access at request time
export const dynamic = "force-dynamic";

export default async function PublicSupplierFormPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Look up supplier by public form token
  const supplier = await prisma.supplier.findUnique({
    where: { publicFormToken: token },
  });

  if (!supplier) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center">
          <div className="text-5xl mb-4">🔗</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Expired or Invalid</h1>
          <p className="text-gray-600">
            This supplier form link is no longer valid. Please contact the company that
            sent you this link to request a new one.
          </p>
        </div>
      </div>
    );
  }

  // Get default reporting year for the pre-fill
  const company = await prisma.company.findUnique({
    where: { id: DEMO_COMPANY_ID },
  });
  const reportingYear = company?.reportingYear ?? new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-md p-8">
        {/* Header */}
        <div className="mb-8 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🌿</span>
            <h1 className="text-2xl font-bold text-gray-900">GreenLedger</h1>
          </div>
          <h2 className="text-lg font-semibold text-gray-700 mt-4">
            Supplier Emission Data Form
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Please provide your emission-related activity data for the reporting period.
            This data will be used to calculate your scope 3 contribution.
          </p>
        </div>

        <SupplierFormClient
          token={token}
          supplierName={supplier.name}
          reportingYear={reportingYear}
        />
      </div>
    </div>
  );
}
