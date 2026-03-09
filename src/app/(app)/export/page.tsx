import PageHeader from "@/components/layout/PageHeader";
import ExportButton from "@/components/export/ExportButton";
import Card from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default function ExportPage() {
  return (
    <div>
      <PageHeader
        title="Export — CSRD Climate Report"
        description="Generate and download the audit-ready PDF report for your reporting period"
      />

      <div className="max-w-2xl space-y-6">
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            Report Contents
          </h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>
                <strong>Cover page</strong> — company name and reporting year
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>
                <strong>Emissions summary</strong> — Scope 1, 2, 3, and total
                (tCO₂e)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>
                <strong>Scope 3 breakdown</strong> — material categories with
                totals (non-material categories footnoted)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>
                <strong>Methodology</strong> — documentation from your
                methodology notes
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>
                <strong>Assumptions &amp; data quality</strong> — proxy
                estimates and low-confidence records for auditor review
              </span>
            </li>
          </ul>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Generate Report
          </h2>
          <ExportButton />
        </Card>

        <p className="text-xs text-gray-400">
          ⚠️ This report is generated from demo data and is not intended for
          regulatory submission. Proxy emission factors are placeholders only.
        </p>
      </div>
    </div>
  );
}
