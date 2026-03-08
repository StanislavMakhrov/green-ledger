"use client";

import { useEffect, useState } from "react";

interface SupplierInfo {
  id: string;
  name: string;
  company: { name: string };
}

interface Category {
  id: string;
  code: string;
  name: string;
}

type ActivityType = "spend_eur" | "ton_km" | "waste_kg";

export default function SupplierFormPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [supplier, setSupplier] = useState<SupplierInfo | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [categoryId, setCategoryId] = useState("");
  const [activityType, setActivityType] = useState<ActivityType>("spend_eur");
  const [activityValue, setActivityValue] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);

  useEffect(() => {
    if (!token) return;
    // Fetch supplier info by token
    fetch(`/api/suppliers/by-token/${token}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json();
      })
      .then((d) => {
        if (d) setSupplier(d);
      });

    fetch("/api/scope3/categories")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) {
          setCategories(d);
          const c1 = d.find((c: Category) => c.code === "C1");
          if (c1) setCategoryId(c1.id);
        }
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);

    const body: Record<string, unknown> = {
      token,
      categoryId,
      notes,
    };
    body[activityType] = Number(activityValue);

    const res = await fetch("/api/public/supplier-form", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSubmitting(false);
    if (res.ok) {
      setSubmitted(true);
    }
  };

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-800 mb-2">Link not found</h1>
          <p className="text-gray-500">This supplier form link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white rounded-2xl border p-10 shadow-sm max-w-md">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">
            Thank you!
          </h1>
          <p className="text-gray-500 text-sm">
            Your emissions data has been submitted. The reporting company will
            include it in their CSRD climate report.
          </p>
        </div>
      </div>
    );
  }

  const activityLabels: Record<ActivityType, string> = {
    spend_eur: "Spend (EUR)",
    ton_km: "Transport (ton·km)",
    waste_kg: "Waste (kg)",
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <span className="text-3xl">🌿</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            GreenLedger
          </h1>
          <p className="text-gray-500 text-sm mt-1">Supplier Emissions Data Form</p>
        </div>

        {supplier && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 text-sm text-emerald-800">
            <strong>{supplier.name}</strong> · submitting data for{" "}
            <strong>{supplier.company.name}</strong>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border p-8 shadow-sm"
        >
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scope 3 Category
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Activity Data Type
            </label>
            <div className="flex gap-3">
              {(["spend_eur", "ton_km", "waste_kg"] as ActivityType[]).map((t) => (
                <label
                  key={t}
                  className={`flex-1 border rounded-lg px-3 py-2 text-sm cursor-pointer text-center transition-colors ${
                    activityType === t
                      ? "bg-emerald-700 text-white border-emerald-700"
                      : "bg-white text-gray-600 border-gray-200 hover:border-emerald-400"
                  }`}
                >
                  <input
                    type="radio"
                    className="hidden"
                    name="activityType"
                    value={t}
                    checked={activityType === t}
                    onChange={() => setActivityType(t)}
                  />
                  {activityLabels[t]}
                </label>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {activityLabels[activityType]} *
            </label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              type="number"
              step="0.01"
              required
              placeholder={`Enter value in ${activityLabels[activityType]}`}
              value={activityValue}
              onChange={(e) => setActivityValue(e.target.value)}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes / Comments (optional)
            </label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm resize-y min-h-[80px]"
              placeholder="Any additional context about the data…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !categoryId}
            className="w-full bg-emerald-700 text-white py-3 rounded-xl text-sm font-semibold hover:bg-emerald-800 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Submitting…" : "Submit Emissions Data"}
          </button>
        </form>
      </div>
    </div>
  );
}
