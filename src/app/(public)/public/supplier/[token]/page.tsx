"use client";
import { useEffect, useState } from "react";

interface SupplierInfo {
  supplierName: string;
  token: string;
}

export default function SupplierFormPage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState<string>("");
  const [supplier, setSupplier] = useState<SupplierInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState({ spend_eur: "", ton_km: "", waste_kg: "" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function init() {
      const resolvedParams = await params;
      setToken(resolvedParams.token);
      const res = await fetch(`/api/public/supplier/${resolvedParams.token}`);
      if (!res.ok) { setNotFound(true); return; }
      setSupplier(await res.json());
    }
    void init();
  }, [params]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const body = {
      spend_eur: form.spend_eur ? Number(form.spend_eur) : null,
      ton_km: form.ton_km ? Number(form.ton_km) : null,
      waste_kg: form.waste_kg ? Number(form.waste_kg) : null,
    };
    const res = await fetch(`/api/public/supplier/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError((data as { error?: string }).error ?? "Submission failed");
      return;
    }
    setSubmitted(true);
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center max-w-sm">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-gray-700 mb-2">Link Not Found</h1>
          <p className="text-gray-500 text-sm">This supplier form link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center max-w-sm">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-xl font-bold text-green-700 mb-2">Thank you!</h1>
          <p className="text-gray-600 text-sm">Your emissions data has been submitted successfully. Your customer will use this data for their CSRD climate report.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center py-12 px-4">
      <div className="bg-white rounded-lg shadow p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">🌿</div>
          <h1 className="text-2xl font-bold text-green-800">GreenLedger</h1>
          <p className="text-gray-500 text-sm mt-1">Supplier Emissions Data Form</p>
        </div>

        <div className="bg-green-50 rounded p-3 mb-6 text-sm text-green-800">
          <strong>{supplier.supplierName}</strong> — Please provide your emissions activity data below.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purchased Goods / Services Spend (EUR)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 50000"
              className="w-full border rounded px-3 py-2 text-sm"
              value={form.spend_eur}
              onChange={(e) => setForm({ ...form, spend_eur: e.target.value })}
            />
            <p className="text-xs text-gray-400 mt-1">Annual spend on goods/services purchased from your company</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transport Activity (tonne-kilometres)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 12500"
              className="w-full border rounded px-3 py-2 text-sm"
              value={form.ton_km}
              onChange={(e) => setForm({ ...form, ton_km: e.target.value })}
            />
            <p className="text-xs text-gray-400 mt-1">Total freight transported (tonnes × distance in km)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Waste Generated (kg)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 2500"
              className="w-full border rounded px-3 py-2 text-sm"
              value={form.waste_kg}
              onChange={(e) => setForm({ ...form, waste_kg: e.target.value })}
            />
            <p className="text-xs text-gray-400 mt-1">Total waste generated in your operations (kg)</p>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || (!form.spend_eur && !form.ton_km && !form.waste_kg)}
            className="w-full bg-green-700 text-white py-3 rounded font-medium hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting…" : "Submit Emissions Data"}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-4">
          Your data will be used solely for CSRD climate reporting purposes.
        </p>
      </div>
    </div>
  );
}
