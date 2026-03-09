"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Card from "@/components/ui/Card";

interface Scope1RecordFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const DATA_SOURCES = [
  { value: "manual", label: "Manual entry" },
  { value: "csv_import", label: "CSV import" },
];

export default function Scope1RecordForm({
  onSuccess,
  onCancel,
}: Scope1RecordFormProps) {
  const [periodYear, setPeriodYear] = useState("2024");
  const [valueTco2e, setValueTco2e] = useState("");
  const [calculationMethod, setCalculationMethod] = useState("");
  const [emissionFactorsSource, setEmissionFactorsSource] = useState("");
  const [dataSource, setDataSource] = useState("manual");
  const [assumptions, setAssumptions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/scope1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodYear: Number(periodYear),
          valueTco2e: Number(valueTco2e),
          calculationMethod,
          emissionFactorsSource,
          dataSource,
          assumptions: assumptions || undefined,
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

  return (
    <Card className="mb-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">
        Add Scope 1 Record
      </h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          placeholder="e.g. 45.20"
        />
        <Input
          id="calculationMethod"
          label="Calculation Method"
          value={calculationMethod}
          onChange={(e) => setCalculationMethod(e.target.value)}
          required
          placeholder="e.g. Direct measurement — combustion"
        />
        <Input
          id="emissionFactorsSource"
          label="Emission Factors Source"
          value={emissionFactorsSource}
          onChange={(e) => setEmissionFactorsSource(e.target.value)}
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
        <div className="md:col-span-2">
          <Textarea
            id="assumptions"
            label="Assumptions (optional)"
            value={assumptions}
            onChange={(e) => setAssumptions(e.target.value)}
            rows={2}
            placeholder="Document any assumptions or data quality notes"
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
