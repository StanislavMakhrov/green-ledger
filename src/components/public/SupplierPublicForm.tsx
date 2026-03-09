"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

interface Category {
  id: string;
  code: string;
  name: string;
}

interface SupplierPublicFormProps {
  supplierName: string;
  categories: Category[];
  token: string;
}

export default function SupplierPublicForm({
  supplierName,
  categories,
  token,
}: SupplierPublicFormProps) {
  const defaultCategoryId =
    categories.find((c) => c.code === "C1")?.id ?? categories[0]?.id ?? "";

  const [categoryId, setCategoryId] = useState(defaultCategoryId);
  const [spendEur, setSpendEur] = useState("");
  const [tonKm, setTonKm] = useState("");
  const [wasteKg, setWasteKg] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: `${c.code} — ${c.name}`,
  }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!spendEur && !tonKm && !wasteKg) {
      setError(
        "Please provide at least one of: Spend (EUR), Transport (tonne-km), or Waste (kg)"
      );
      return;
    }

    setLoading(true);

    try {
      const body: Record<string, string | number> = { categoryId };
      if (spendEur) body.spend_eur = Number(spendEur);
      if (tonKm) body.ton_km = Number(tonKm);
      if (wasteKg) body.waste_kg = Number(wasteKg);

      const res = await fetch(`/api/public/supplier/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Submission failed");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Thank you, {supplierName}!
        </h2>
        <p className="text-gray-600">
          Your activity data has been submitted successfully.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          The sustainability team will use this data to calculate your supply chain emissions contribution.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="text-sm text-gray-600 mb-4">
          Please provide your activity data for at least one of the fields below.
          Your data will be used to estimate greenhouse gas emissions.
        </p>
      </div>

      <Select
        id="categoryId"
        label="Emission Category"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        options={categoryOptions}
      />

      <div className="border-t border-gray-100 pt-4">
        <p className="text-sm font-medium text-gray-700 mb-3">
          Activity Data (fill in at least one)
        </p>

        <div className="space-y-4">
          <Input
            id="spendEur"
            label="Procurement Spend (EUR)"
            type="number"
            step="0.01"
            min="0"
            value={spendEur}
            onChange={(e) => setSpendEur(e.target.value)}
            placeholder="e.g. 50000"
          />
          <p className="text-xs text-gray-500 -mt-2">
            Total spend on goods or services in EUR for the reporting period
          </p>

          <Input
            id="tonKm"
            label="Transport Activity (tonne-km)"
            type="number"
            step="0.1"
            min="0"
            value={tonKm}
            onChange={(e) => setTonKm(e.target.value)}
            placeholder="e.g. 5000"
          />
          <p className="text-xs text-gray-500 -mt-2">
            Freight transport in tonne-kilometres (weight × distance)
          </p>

          <Input
            id="wasteKg"
            label="Waste Generated (kg)"
            type="number"
            step="0.1"
            min="0"
            value={wasteKg}
            onChange={(e) => setWasteKg(e.target.value)}
            placeholder="e.g. 200"
          />
          <p className="text-xs text-gray-500 -mt-2">
            Total waste generated in kilograms
          </p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={loading} className="w-full">
        {loading ? "Submitting..." : "Submit Activity Data"}
      </Button>

      <p className="text-xs text-center text-gray-400">
        Your data will be used to estimate greenhouse gas emissions using DEFRA
        2023 proxy factors (demo placeholders only).
      </p>
    </form>
  );
}
