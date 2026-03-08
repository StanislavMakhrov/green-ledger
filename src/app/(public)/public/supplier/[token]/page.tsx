"use client";

import { useState, useEffect } from "react";

interface SupplierInfo {
  name: string;
  sector: string;
  country: string;
}

export default function SupplierFormPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [supplier, setSupplier] = useState<SupplierInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [dataType, setDataType] = useState<"spend_eur" | "ton_km" | "waste_kg">(
    "spend_eur"
  );
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params;
      setToken(resolved.token);
    };
    void resolveParams();
  }, [params]);

  useEffect(() => {
    if (!token) return;
    const loadSupplier = async () => {
      try {
        const res = await fetch(`/api/public/supplier/${token}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error("Failed to load");
        const data = (await res.json()) as SupplierInfo;
        setSupplier(data);
      } catch {
        setNotFound(true);
      }
    };
    void loadSupplier();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload: Record<string, string | number> = { notes };
      payload[dataType] = parseFloat(value);
      const res = await fetch(`/api/public/supplier/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-700">Link not found</h1>
          <p className="text-gray-500 mt-2">
            This supplier form link is invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-green-800">
            Thank you, {supplier.name}!
          </h1>
          <p className="text-gray-500 mt-2">
            Your emission data has been submitted successfully.
          </p>
        </div>
      </div>
    );
  }

  const dataTypeLabels = {
    spend_eur: "Total spend (EUR)",
    ton_km: "Transport activity (tonne-km)",
    waste_kg: "Waste generated (kg)",
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 w-full max-w-lg">
        <div className="mb-6">
          <div className="text-2xl font-bold text-green-800 mb-1">
            🌿 Supplier Emission Form
          </div>
          <p className="text-sm text-gray-500">
            <strong>{supplier.name}</strong> · {supplier.sector} ·{" "}
            {supplier.country}
          </p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What type of data are you providing?
            </label>
            <div className="space-y-2">
              {(
                ["spend_eur", "ton_km", "waste_kg"] as const
              ).map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="dataType"
                    value={type}
                    checked={dataType === type}
                    onChange={() => setDataType(type)}
                    className="accent-green-700"
                  />
                  <span className="text-sm text-gray-700">
                    {dataTypeLabels[type]}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {dataTypeLabels[dataType]}
            </label>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder="Enter value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes / Assumptions (optional)
            </label>
            <textarea
              rows={3}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-y"
              placeholder="Any additional context…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-4 py-2.5 bg-green-700 text-white rounded-md text-sm font-medium hover:bg-green-800 disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit Emission Data"}
          </button>
        </form>
      </div>
    </div>
  );
}
