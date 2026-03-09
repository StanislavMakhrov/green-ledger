"use client";

import { use, useEffect, useState } from "react";

interface SupplierInfo {
  id: string;
  name: string;
  sector: string;
}

export default function SupplierFormPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [supplier, setSupplier] = useState<SupplierInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    spend_eur: "",
    ton_km: "",
    waste_kg: "",
  });

  useEffect(() => {
    fetch(`/api/supplier-form/${token}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json() as Promise<SupplierInfo>;
      })
      .then((data) => { if (data) setSupplier(data); });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: Record<string, number> = {};
    if (form.spend_eur) body.spend_eur = parseFloat(form.spend_eur);
    if (form.ton_km) body.ton_km = parseFloat(form.ton_km);
    if (form.waste_kg) body.waste_kg = parseFloat(form.waste_kg);

    const res = await fetch(`/api/supplier-form/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setSubmitted(true);
    } else {
      const err = (await res.json()) as { error: string };
      alert(err.error ?? "Submission failed.");
    }
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow text-center max-w-md">
          <p className="text-4xl mb-4">🚫</p>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Form Not Available</h2>
          <p className="text-gray-600">This supplier form link is invalid or has been deactivated.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow text-center max-w-md">
          <p className="text-4xl mb-4">✅</p>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Thank you!</h2>
          <p className="text-gray-600">Your emissions data has been submitted successfully.</p>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
      <div className="bg-white p-8 rounded-lg shadow max-w-lg w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">🌿 Supplier Emissions Form</h1>
          <p className="text-gray-600 mt-1">
            <strong>{supplier.name}</strong> · {supplier.sector}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Please provide your activity data below. We&apos;ll calculate your estimated
            carbon footprint using proxy emission factors.
          </p>
        </div>

        <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Annual Spend (EUR)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.spend_eur}
              onChange={(e) => setForm({ ...form, spend_eur: e.target.value })}
              placeholder="e.g. 50000"
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transport (tonne-km)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.ton_km}
              onChange={(e) => setForm({ ...form, ton_km: e.target.value })}
              placeholder="e.g. 10000"
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Waste Generated (kg)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.waste_kg}
              onChange={(e) => setForm({ ...form, waste_kg: e.target.value })}
              placeholder="e.g. 500"
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <p className="text-xs text-gray-400">
            Fill in at least one field. Emission values will be calculated using proxy factors.
          </p>
          <button
            type="submit"
            className="w-full bg-green-700 text-white py-3 rounded-md hover:bg-green-800 font-medium"
          >
            Submit Emissions Data
          </button>
        </form>
      </div>
    </div>
  );
}
