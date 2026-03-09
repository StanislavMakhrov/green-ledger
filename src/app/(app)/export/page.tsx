"use client";

import { useState } from "react";

export default function ExportPage() {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/export/pdf");
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "csrd-climate-report.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error generating PDF. Please try again.");
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Export CSRD Report</h2>
      <p className="text-sm text-gray-500 mb-6">
        Generate a PDF report compliant with CSRD/ESRS E1 requirements.
      </p>

      <div className="bg-white rounded-lg shadow p-8 max-w-md">
        <h3 className="text-lg font-semibold mb-4">CSRD Climate Report PDF</h3>
        <p className="text-sm text-gray-600 mb-6">
          The report includes:
        </p>
        <ul className="text-sm text-gray-600 mb-6 list-disc pl-5 space-y-1">
          <li>Cover page with company details and reporting year</li>
          <li>Emissions summary (Scope 1, 2, 3, Total)</li>
          <li>Scope 3 material category breakdown</li>
          <li>Methodology notes per scope</li>
          <li>Data quality and assumptions table</li>
        </ul>
        <button
          onClick={() => { void handleDownload(); }}
          disabled={downloading}
          className="bg-green-700 text-white px-6 py-3 rounded-md hover:bg-green-800 disabled:opacity-50 w-full"
        >
          {downloading ? "⏳ Generating PDF…" : "📄 Download PDF Report"}
        </button>
      </div>
    </div>
  );
}
