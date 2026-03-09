"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Card from "@/components/ui/Card";

interface Scope3Category {
  id: string;
  code: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface Scope3RecordFormProps {
  categories: Scope3Category[];
  suppliers: Supplier[];
  onSuccess: () => void;
  onCancel: () => void;
}

const CALCULATION_METHODS = [
  { value: "spend_based", label: "Spend-based" },
  { value: "activity_based", label: "Activity-based" },
  { value: "supplier_specific", label: "Supplier-specific" },
];

const DATA_SOURCES = [
  { value: "proxy", label: "Proxy estimate" },
  { value: "supplier_form", label: "Supplier form" },
  { value: "csv_import", label: "CSV import" },
];

export default function Scope3RecordForm({
  categories,
  suppliers,
  onSuccess,
  onCancel,
}: Scope3RecordFormProps) {
  const [categoryId, setCategoryId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [periodYear, setPeriodYear] = useState("2024");
  const [valueTco2e, setValueTco2e] = useState("");
  const [calculationMethod, setCalculationMethod] = useState("spend_based");
  const [emissionFactorSource, setEmissionFactorSource] = useState("");
  const [dataSource, setDataSource] = useState("proxy");
  const [assumptions, setAssumptions] = useState("");
  const [confidence, setConfidence] = useState("1.0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!categoryId) {
      setError("Please select a category");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/scope3/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          supplierId: supplierId || undefined,
          periodYear: Number(periodYear),
          valueTco2e: Number(valueTco2e),
          calculationMethod,
          emissionFactorSource,
          dataSource,
          assumptions: assumptions || undefined,
          confidence: Number(confidence),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to add record");
        return;
      }

      onSuccess();
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: `${c.code} — ${c.name}`,
  }));

  const supplierOptions = [
    { value: "", label: "No supplier (anonymous)" },
    ...suppliers.map((s) => ({ value: s.id, label: s.name })),
  ];

  return (
    <Card className="mb-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">
        Add Scope 3 Record
      </h3>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <Select
          id="categoryId"
          label="Category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          options={categoryOptions}
          placeholder="Select category..."
          required
        />
        <Select
          id="supplierId"
          label="Supplier (optional)"
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
          options={supplierOptions}
        />
        <Input
          id="periodYear"
          label="Period Year"
          type="number"
          value={periodYear}
          onChange={(e) => setPeriodYear(e.target.value)}
          required
          min="2000"
          max="2100"
        />
        <Input
          id="valueTco2e"
          label="Value (tCO₂e)"
          type="number"
          step="0.001"
          value={valueTco2e}
          onChange={(e) => setValueTco2e(e.target.value)}
          required
          placeholder="e.g. 120.50"
        />
        <Select
          id="calculationMethod"
          label="Calculation Method"
          value={calculationMethod}
          onChange={(e) => setCalculationMethod(e.target.value)}
          options={CALCULATION_METHODS}
        />
        <Input
          id="emissionFactorSource"
          label="Emission Factor Source"
          value={emissionFactorSource}
          onChange={(e) => setEmissionFactorSource(e.target.value)}
          required
          placeholder="e.g. DEFRA 2023"
        />
        <Select
          id="dataSource"
          label="Data Source"
          value={dataSource}
          onChange={(e) => setDataSource(e.target.value)}
          options={DATA_SOURCES}
        />
        <Input
          id="confidence"
          label="Confidence (0–1)"
          type="number"
          step="0.1"
          min="0"
          max="1"
          value={confidence}
          onChange={(e) => setConfidence(e.target.value)}
        />
        <div className="md:col-span-2">
          <Textarea
            id="assumptions"
            label="Assumptions (optional)"
            value={assumptions}
            onChange={(e) => setAssumptions(e.target.value)}
            rows={2}
            placeholder="Document assumptions and data quality notes"
          />
        </div>

        {error && (
          <div className="md:col-span-2">
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </p>
          </div>
        )}

        <div className="md:col-span-2 flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Add Record"}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
