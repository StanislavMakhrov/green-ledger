export default function ExportPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Export Report</h1>
      <p className="text-gray-500 mb-8 text-sm">
        Generate a printable HTML report with all emissions data, methodology, and
        assumptions.
      </p>

      <div className="bg-white rounded-xl border shadow-sm p-6 max-w-sm">
        <h2 className="font-semibold text-gray-700 mb-3">GHG Emissions Report</h2>
        <p className="text-sm text-gray-500 mb-4">
          Opens a print-ready HTML page with:
        </p>
        <ul className="text-sm text-gray-600 space-y-1 mb-5 list-disc list-inside">
          <li>Executive summary (Scope 1, 2, 3, Total)</li>
          <li>Scope 3 breakdown by material category</li>
          <li>Methodology notes per scope</li>
          <li>Assumptions &amp; data quality section</li>
        </ul>
        <a
          href="/api/export/pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-green-700 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-green-800"
        >
          Open Report →
        </a>
        <p className="mt-3 text-xs text-gray-400">
          Use your browser&apos;s Print (Ctrl+P / ⌘P) to save as PDF.
        </p>
      </div>
    </div>
  );
}
