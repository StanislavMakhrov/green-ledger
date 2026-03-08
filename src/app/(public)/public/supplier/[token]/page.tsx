"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface SupplierInfo {
  supplierName: string;
  companyName: string;
  reportingYear: number;
}

interface FormState {
  spend_eur: string;
  ton_km: string;
  waste_kg: string;
}

export default function SupplierFormPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [info, setInfo] = useState<SupplierInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState<FormState>({
    spend_eur: "",
    ton_km: "",
    waste_kg: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/public/supplier/${token}`);
      if (!res.ok) {
        setNotFound(true);
        return;
      }
      const data = (await res.json()) as SupplierInfo;
      setInfo(data);
    };
    void load();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const spend = form.spend_eur !== "" ? parseFloat(form.spend_eur) : undefined;
    const ton = form.ton_km !== "" ? parseFloat(form.ton_km) : undefined;
    const waste = form.waste_kg !== "" ? parseFloat(form.waste_kg) : undefined;

    if (spend == null && ton == null && waste == null) {
      setError("Please fill in at least one field.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/supplier/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(spend != null && { spend_eur: spend }),
          ...(ton != null && { ton_km: ton }),
          ...(waste != null && { waste_kg: waste }),
        }),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? "Submission failed");
      }
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSubmitting(false);
    }
  };

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-4xl mb-4">🌿</p>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Link not found</h1>
          <p className="text-gray-500 text-sm">
            This supplier form link may have expired or be invalid.
          </p>
        </div>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-md p-10 max-w-md text-center">
          <p className="text-5xl mb-4">✅</p>
          <h1 className="text-xl font-bold text-gray-800 mb-2">
            Thank you, {info.supplierName}!
          </h1>
          <p className="text-gray-500 text-sm">
            Your emissions data has been received by {info.companyName}. No further
            action is needed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-lg">
        <div className="mb-6 text-center">
          <p className="text-3xl mb-2">🌿</p>
          <h1 className="text-xl font-bold text-gray-800">
            GHG Emissions Form
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Submitted by <strong>{info.supplierName}</strong> for{" "}
            <strong>{info.companyName}</strong>
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Reporting year: {info.reportingYear}
          </p>
        </div>

        <p className="text-sm text-gray-600 mb-5">
          Please fill in at least one of the fields below. Your data will be used to
          calculate your supply chain emissions contribution.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total spend (EUR)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 150000"
              value={form.spend_eur}
              onChange={(e) => setForm((f) => ({ ...f, spend_eur: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-400 mt-0.5">
              Spend-based estimate (factor: 0.233 kgCO₂e/€)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Freight transport (tonne-km)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="e.g. 1200"
              value={form.ton_km}
              onChange={(e) => setForm((f) => ({ ...f, ton_km: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-400 mt-0.5">
              Activity-based (factor: 0.062 kgCO₂e/tkm)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Waste generated (kg)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="e.g. 5000"
              value={form.waste_kg}
              onChange={(e) => setForm((f) => ({ ...f, waste_kg: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-400 mt-0.5">
              Activity-based (factor: 0.467 kgCO₂e/kg)
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-green-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-50 mt-2"
          >
            {submitting ? "Submitting…" : "Submit Emissions Data"}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-5">
          This data is submitted securely to {info.companyName}&apos;s GHG inventory system.
        </p>
      </div>
    </div>
  );
}
