"use client";

import { useState } from "react";

type InputType = "spend_eur" | "ton_km" | "waste_kg";

interface SupplierFormClientProps {
  token: string;
  supplierName: string;
  reportingYear: number;
}

export default function SupplierFormClient({
  token,
  supplierName,
  reportingYear,
}: SupplierFormClientProps) {
  const [inputType, setInputType] = useState<InputType>("spend_eur");
  const [value, setValue] = useState("");
  const [periodYear, setPeriodYear] = useState(reportingYear.toString());
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputLabels: Record<InputType, { label: string; placeholder: string; unit: string }> = {
    spend_eur: {
      label: "Purchased Goods & Services (EUR spend)",
      placeholder: "50000",
      unit: "EUR",
    },
    ton_km: {
      label: "Transport (ton-km)",
      placeholder: "12000",
      unit: "ton-km",
    },
    waste_kg: {
      label: "Waste Disposed (kg)",
      placeholder: "3000",
      unit: "kg",
    },
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload: Record<string, unknown> = {
      periodYear: parseInt(periodYear),
    };
    payload[inputType] = parseFloat(value);

    try {
      const res = await fetch(`/api/public/supplier/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error);
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Thank you!
        </h2>
        <p className="text-gray-600">
          Your emission data has been submitted successfully.
        </p>
        <p className="text-sm text-gray-400 mt-4">
          You can close this window.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
      {/* Supplier info */}
      <div className="bg-green-50 rounded-lg p-4">
        <p className="text-sm text-gray-600">
          Submitting on behalf of:
        </p>
        <p className="text-lg font-semibold text-gray-900">{supplierName}</p>
      </div>

      {/* Reporting Year */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Reporting Year *
        </label>
        <input
          type="number"
          required
          value={periodYear}
          onChange={(e) => setPeriodYear(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Input Type Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What data can you provide? *
        </label>
        <div className="space-y-2">
          {(["spend_eur", "ton_km", "waste_kg"] as InputType[]).map((type) => (
            <label
              key={type}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                inputType === type
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="inputType"
                value={type}
                checked={inputType === type}
                onChange={() => {
                  setInputType(type);
                  setValue("");
                }}
                className="text-green-600"
              />
              <span className="text-sm text-gray-700">
                {inputLabels[type].label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Value Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {inputLabels[inputType].label} *
        </label>
        <div className="relative">
          <input
            type="number"
            step="any"
            min="0"
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={inputLabels[inputType].placeholder}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <span className="absolute right-3 top-2 text-sm text-gray-400">
            {inputLabels[inputType].unit}
          </span>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Additional Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Any relevant context about the data provided…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-green-700 text-white py-3 rounded-lg hover:bg-green-800 transition-colors font-medium disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit Emission Data"}
      </button>
    </form>
  );
}
