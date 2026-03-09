"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

export default function ExportButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/export", { method: "POST" });

      if (!res.ok) {
        setError("Failed to generate report. Please try again.");
        return;
      }

      // Trigger file download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "csrd-climate-report.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-4">
      <Button
        size="lg"
        onClick={handleExport}
        disabled={loading}
        className="flex items-center gap-2"
      >
        {loading ? (
          <>
            <Spinner size="sm" className="text-white" />
            Generating Report...
          </>
        ) : (
          "📄 Generate CSRD Climate Report"
        )}
      </Button>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {loading && (
        <p className="text-sm text-gray-500">
          Generating your PDF report — this may take a few seconds...
        </p>
      )}
    </div>
  );
}
