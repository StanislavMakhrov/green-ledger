"use client";
import { useState } from "react";

export default function ExportPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/export/pdf");
      if (!res.ok) {
        setError("Failed to generate PDF. Please try again.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "csrd-climate-report.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Export Report</h1>
      <p className="text-gray-500 mb-8 text-sm">
        Download an audit-ready CSRD Climate Report PDF containing emissions summary, Scope 3 breakdown, methodology notes, and assumptions documentation.
      </p>

      <div className="bg-white rounded shadow p-8 flex flex-col items-center text-center max-w-md">
        <div className="text-5xl mb-4">📄</div>
        <h2 className="text-lg font-semibold text-gray-700 mb-2">CSRD Climate Report</h2>
        <p className="text-sm text-gray-500 mb-6">
          Includes cover page, emissions summary table, Scope 3 breakdown by material category, methodology section, and assumptions &amp; data quality notes.
        </p>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={loading}
          className="bg-green-700 text-white px-6 py-3 rounded hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? "Generating PDF…" : "Download PDF Report"}
        </button>
      </div>
    </div>
  );
}
