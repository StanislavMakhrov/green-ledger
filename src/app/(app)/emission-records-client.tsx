"use client";

import { useState } from "react";

interface EmissionRecord {
  id: string;
  periodYear: number;
  valueTco2e: number;
  calculationMethod: string;
  emissionFactorsSource: string;
  dataSource: string;
  assumptions: string | null;
  createdAt: string;
}

interface EmissionRecordsClientProps {
  initialRecords: EmissionRecord[];
  apiPath: string;
  title: string;
  description: string;
  defaultYear: number;
}

export function EmissionRecordsClient({
  initialRecords,
  apiPath,
  title,
  description,
  defaultYear,
}: EmissionRecordsClientProps) {
  const [records, setRecords] = useState<EmissionRecord[]>(initialRecords);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    valueTco2e: "",
    calculationMethod: "",
    emissionFactorsSource: "",
    assumptions: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          valueTco2e: parseFloat(form.valueTco2e),
          dataSource: "manual",
          periodYear: defaultYear,
        }),
      });
      if (!res.ok) throw new Error("Failed to add record");
      const created = (await res.json()) as EmissionRecord;
      setRecords((prev) => [...prev, created]);
      setForm({
        valueTco2e: "",
        calculationMethod: "",
        emissionFactorsSource: "",
        assumptions: "",
      });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  const total = records.reduce((s, r) => s + r.valueTco2e, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 bg-green-700 text-white rounded-md text-sm font-medium hover:bg-green-800"
        >
          {showForm ? "Cancel" : "+ Add Record"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => void handleAdd(e)}
          className="bg-white border border-gray-200 rounded-xl p-6 mb-6 grid grid-cols-2 gap-4"
        >
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Value (tCO₂e)
            </label>
            <input
              required
              type="number"
              step="0.0001"
              min="0"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              value={form.valueTco2e}
              onChange={(e) =>
                setForm((f) => ({ ...f, valueTco2e: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Calculation Method
            </label>
            <input
              required
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder="e.g. direct measurement, IPCC factor"
              value={form.calculationMethod}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  calculationMethod: e.target.value,
                }))
              }
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Emission Factors Source
            </label>
            <input
              required
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder="e.g. DEFRA 2023, IEA 2023"
              value={form.emissionFactorsSource}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  emissionFactorsSource: e.target.value,
                }))
              }
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Assumptions
            </label>
            <input
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder="Optional"
              value={form.assumptions}
              onChange={(e) =>
                setForm((f) => ({ ...f, assumptions: e.target.value }))
              }
            />
          </div>
          <div className="col-span-2 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-green-700 text-white rounded-md text-sm font-medium hover:bg-green-800 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Add Record"}
            </button>
          </div>
          {error && (
            <p className="col-span-2 text-sm text-red-600">{error}</p>
          )}
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-green-50 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Year</th>
              <th className="px-4 py-3 text-right">tCO₂e</th>
              <th className="px-4 py-3 text-left">Method</th>
              <th className="px-4 py-3 text-left">Factor Source</th>
              <th className="px-4 py-3 text-left">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  No records yet.
                </td>
              </tr>
            )}
            {records.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{r.periodYear}</td>
                <td className="px-4 py-3 text-right font-mono">
                  {r.valueTco2e.toFixed(4)}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {r.calculationMethod}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {r.emissionFactorsSource}
                </td>
                <td className="px-4 py-3 text-gray-600">{r.dataSource}</td>
              </tr>
            ))}
          </tbody>
          {records.length > 0 && (
            <tfoot className="bg-gray-50">
              <tr>
                <td className="px-4 py-3 font-semibold text-gray-700">
                  Total
                </td>
                <td className="px-4 py-3 text-right font-mono font-semibold text-green-800">
                  {total.toFixed(4)}
                </td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
