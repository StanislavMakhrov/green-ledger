"use client";

import { useState } from "react";

export default function ExportPage() {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const res = await fetch("/api/export/pdf");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "csrd-report.html";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Export error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Export Report</h1>
      <p className="text-sm text-gray-500 mb-8">
        Download the CSRD Climate Report for your reporting year
      </p>

      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          CSRD Climate Report (HTML)
        </h2>
        <ul className="text-sm text-gray-600 space-y-1 mb-6 list-disc list-inside">
          <li>Cover page with company name &amp; reporting year</li>
          <li>Summary table: Scope 1, 2, 3, Total (tCO₂e)</li>
          <li>Scope 3 breakdown by material categories</li>
          <li>Methodology notes for each scope</li>
          <li>Assumptions &amp; data quality section</li>
        </ul>
        <p className="text-xs text-gray-400 mb-4">
          The report is generated as an HTML file. Open it in your browser and
          use File → Print → Save as PDF to produce a PDF document.
        </p>
        <button
          onClick={() => void handleDownload()}
          disabled={loading}
          className="px-5 py-2.5 bg-green-700 text-white rounded-md text-sm font-medium hover:bg-green-800 disabled:opacity-50"
        >
          {loading ? "Generating…" : "⬇ Download Report"}
        </button>
      </div>
    </div>
  );
}
