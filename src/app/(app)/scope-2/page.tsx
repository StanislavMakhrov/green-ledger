"use client";

import { useEffect, useState } from "react";

interface Scope2Record {
  id: string;
  periodYear: number;
  valueTco2e: number;
  calculationMethod: string;
  emissionFactorsSource: string;
  dataSource: string;
  assumptions: string | null;
}

interface AddForm {
  periodYear: string;
  valueTco2e: string;
  calculationMethod: string;
  emissionFactorsSource: string;
  dataSource: string;
  assumptions: string;
}

const emptyForm: AddForm = {
  periodYear: "2024",
  valueTco2e: "",
  calculationMethod: "market_based",
  emissionFactorsSource: "AIB European Residual Mix 2023",
  dataSource: "manual",
  assumptions: "",
};

export default function Scope2Page() {
  const [records, setRecords] = useState<Scope2Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/scope-2");
    const data = (await res.json()) as Scope2Record[];
    setRecords(data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/scope-2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          periodYear: parseInt(form.periodYear, 10),
          valueTco2e: parseFloat(form.valueTco2e),
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this record?")) return;
    await fetch(`/api/scope-2/${id}`, { method: "DELETE" });
    await load();
  };

  if (loading) return <p className="text-gray-500">Loading…</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Scope 2 — Indirect Energy</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700"
        >
          + Add Record
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>
      )}

      {showForm && (
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="mb-6 p-4 bg-white rounded-xl border shadow-sm space-y-3"
        >
          <h2 className="font-semibold text-gray-700">New Scope 2 Record</h2>
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              placeholder="Year"
              value={form.periodYear}
              onChange={(e) => setForm((f) => ({ ...f, periodYear: e.target.value }))}
              className="border rounded px-3 py-2 text-sm"
              type="number"
            />
            <input
              required
              placeholder="Value (tCO₂e)"
              value={form.valueTco2e}
              onChange={(e) => setForm((f) => ({ ...f, valueTco2e: e.target.value }))}
              className="border rounded px-3 py-2 text-sm"
              type="number"
              step="0.01"
            />
            <select
              value={form.calculationMethod}
              onChange={(e) => setForm((f) => ({ ...f, calculationMethod: e.target.value }))}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="market_based">Market-based</option>
              <option value="location_based">Location-based</option>
            </select>
            <input
              required
              placeholder="Emission factor source"
              value={form.emissionFactorsSource}
              onChange={(e) =>
                setForm((f) => ({ ...f, emissionFactorsSource: e.target.value }))
              }
              className="border rounded px-3 py-2 text-sm"
            />
            <select
              value={form.dataSource}
              onChange={(e) => setForm((f) => ({ ...f, dataSource: e.target.value }))}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="manual">Manual</option>
              <option value="csv_import">CSV Import</option>
            </select>
            <input
              placeholder="Assumptions (optional)"
              value={form.assumptions}
              onChange={(e) => setForm((f) => ({ ...f, assumptions: e.target.value }))}
              className="border rounded px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded text-sm border hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Year</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">tCO₂e</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Method</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Source</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Data</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {records.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{r.periodYear}</td>
                <td className="px-4 py-3 font-mono">{r.valueTco2e.toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-600">{r.calculationMethod}</td>
                <td className="px-4 py-3 text-gray-600">{r.emissionFactorsSource}</td>
                <td className="px-4 py-3 text-gray-600">{r.dataSource}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => void handleDelete(r.id)}
                    className="text-red-600 hover:underline text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  No records yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
