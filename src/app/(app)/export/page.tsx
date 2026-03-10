import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";

// Force dynamic rendering — page requires database access at request time
export const dynamic = "force-dynamic";

export default async function ExportPage() {
  // Find most recent export audit event for timestamp display
  const lastExport = await prisma.auditTrailEvent.findFirst({
    where: { companyId: DEMO_COMPANY_ID, entityType: "export" },
    orderBy: { timestamp: "desc" },
  });

  const lastExportDate = lastExport
    ? new Date(lastExport.timestamp).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Export Report</h1>
        <p className="text-gray-500 mt-1">
          Generate and download your CSRD climate report as a PDF
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-2xl">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            📄 CSRD Climate Report (PDF)
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            The report includes:
          </p>
          <ul className="mt-3 space-y-1 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              Cover page with company name and reporting year
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              Summary table: Scope 1, 2, and 3 totals in tCO₂e
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              Scope 3 breakdown by material category
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              Methodology notes for each scope
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              Assumptions and data quality notes
            </li>
          </ul>
        </div>

        {lastExportDate && (
          <p className="text-xs text-gray-400 mb-4">
            Last exported: {lastExportDate}
          </p>
        )}

        <a
          href="/api/export/pdf"
          download="greenledger-report.pdf"
          className="inline-flex items-center gap-2 bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-800 transition-colors font-medium"
        >
          ⬇ Download PDF Report
        </a>

        <p className="text-xs text-gray-400 mt-4">
          The PDF is generated on demand and reflects the current data in the system.
        </p>
      </div>
    </div>
  );
}
