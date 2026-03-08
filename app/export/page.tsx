/**
 * Export page — generates and downloads the CSRD Climate Report PDF.
 *
 * Client component: provides a button to open the HTML report in a new tab.
 * The user can print it as a PDF from the browser.
 *
 * Related spec: docs/spec.md §"PDF Export"
 */
'use client'

export default function ExportPage() {
  const handleExport = () => {
    window.open('/api/export/pdf', '_blank')
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Export CSRD Climate Report</h1>
      <p className="text-gray-500 mb-6 text-sm">
        Generate a complete ESRS E1 Climate Report including GHG inventory, Scope 3 breakdown,
        methodology notes, and data quality section.
      </p>

      <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-lg">
        <div className="text-center">
          <div className="text-6xl mb-4">📄</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">CSRD Climate Report</h2>
          <p className="text-sm text-gray-500 mb-6">
            The report will open in a new browser tab. Use your browser&apos;s{' '}
            <strong>Print → Save as PDF</strong> function to download it.
          </p>

          <div className="text-left bg-gray-50 rounded-lg p-4 mb-6 text-sm text-gray-600">
            <p className="font-medium text-gray-700 mb-2">Report sections included:</p>
            <ul className="space-y-1">
              <li>✅ Cover page (company + reporting year)</li>
              <li>✅ GHG Inventory Summary (Scope 1, 2, 3, Total)</li>
              <li>✅ Scope 3 breakdown by material category</li>
              <li>✅ Calculation methodology notes</li>
              <li>✅ Assumptions &amp; data quality section</li>
            </ul>
          </div>

          <button
            onClick={handleExport}
            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            🚀 Generate &amp; Open Report
          </button>

          <p className="text-xs text-gray-400 mt-3">
            Tip: In the print dialog, enable &quot;Background graphics&quot; for best results.
          </p>
        </div>
      </div>
    </div>
  )
}
