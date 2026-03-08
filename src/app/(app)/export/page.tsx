export default function ExportPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Export</h1>
      <p className="text-gray-500 mb-8 text-sm">
        Generate your CSRD Climate Report for the reporting year.
      </p>

      <div className="bg-white rounded-xl border p-8 shadow-sm max-w-xl">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          CSRD Climate Report
        </h2>
        <p className="text-sm text-gray-600 mb-4">The export includes:</p>
        <ul className="text-sm text-gray-600 space-y-2 mb-6 list-none">
          {[
            "Cover page — company name and reporting year",
            "Summary table — Scope 1, 2, 3 and Grand Total (tCO₂e)",
            "Scope 3 breakdown by material categories",
            "Methodology section per scope",
            "Assumptions & Data Quality notes",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-emerald-600 mt-0.5">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <a
          href="/api/export/pdf"
          download
          className="inline-block bg-emerald-700 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-emerald-800 transition-colors"
        >
          ⬇ Download CSRD Climate Report
        </a>

        <p className="text-xs text-gray-400 mt-4">
          Downloads as an HTML file. Open in browser and use{" "}
          <kbd className="bg-gray-100 px-1 rounded">Ctrl+P</kbd> to print or
          save as PDF.
        </p>
      </div>
    </div>
  );
}
