"use client";

import { useEffect, useState } from "react";

interface Scope2Record {
  id: string;
  periodYear: number;
  valueTco2e: number;
  calculationMethod: string;
  emissionFactorsSource: string;
  assumptions: string | null;
  createdAt: string;
}

function AddRecordForm({ onAdded }: { onAdded: () => void }) {
  const [form, setForm] = useState({
    periodYear: new Date().getFullYear(),
    valueTco2e: "",
    calculationMethod: "",
    emissionFactorsSource: "",
    assumptions: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/scope2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({
      periodYear: new Date().getFullYear(),
      valueTco2e: "",
      calculationMethod: "",
      emissionFactorsSource: "",
      assumptions: "",
    });
    setSaving(false);
    onAdded();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border p-6 shadow-sm mb-6"
    >
      <h2 className="text-base font-semibold mb-4 text-gray-800">Add Scope 2 Record</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Period Year *</label>
          <input
            className="border rounded-lg px-3 py-2 text-sm w-full"
            type="number"
            required
            value={form.periodYear}
            onChange={(e) => setForm({ ...form, periodYear: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Value (tCO₂e) *</label>
          <input
            className="border rounded-lg px-3 py-2 text-sm w-full"
            type="number"
            step="0.01"
            required
            placeholder="e.g. 85.0"
            value={form.valueTco2e}
            onChange={(e) => setForm({ ...form, valueTco2e: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Calculation Method</label>
          <input
            className="border rounded-lg px-3 py-2 text-sm w-full"
            placeholder="e.g. location-based, market-based"
            value={form.calculationMethod}
            onChange={(e) => setForm({ ...form, calculationMethod: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Emission Factors Source</label>
          <input
            className="border rounded-lg px-3 py-2 text-sm w-full"
            placeholder="e.g. IEA 2023 grid factors"
            value={form.emissionFactorsSource}
            onChange={(e) =>
              setForm({ ...form, emissionFactorsSource: e.target.value })
            }
          />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-gray-500 block mb-1">Assumptions</label>
          <input
            className="border rounded-lg px-3 py-2 text-sm w-full"
            placeholder="Optional assumptions or notes"
            value={form.assumptions}
            onChange={(e) => setForm({ ...form, assumptions: e.target.value })}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="mt-4 bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-emerald-800 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Add Record"}
      </button>
    </form>
  );
}

export default function Scope2Page() {
  const [records, setRecords] = useState<Scope2Record[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/scope2")
      .then((r) => r.json())
      .then((d) => setRecords(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const deleteRecord = async (id: string) => {
    if (!confirm("Delete this record?")) return;
    await fetch(`/api/scope2/${id}`, { method: "DELETE" });
    load();
  };

  const total = records.reduce((s, r) => s + r.valueTco2e, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Scope 2 — Energy Indirect Emissions
      </h1>
      <AddRecordForm onAdded={load} />

      {loading ? (
        <p className="text-gray-400 animate-pulse">Loading…</p>
      ) : records.length === 0 ? (
        <p className="text-gray-400">No Scope 2 records yet.</p>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">
              {records.length} record{records.length !== 1 ? "s" : ""}
            </span>
            <span className="text-sm font-semibold text-blue-700">
              Total: {total.toLocaleString("en-DE", { maximumFractionDigits: 1 })} tCO₂e
            </span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Year</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">tCO₂e</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Method</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Factors Source</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Assumptions</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {records.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">{r.periodYear}</td>
                  <td className="px-4 py-3 font-mono font-medium">
                    {r.valueTco2e.toLocaleString("en-DE", { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.calculationMethod}</td>
                  <td className="px-4 py-3 text-gray-600">{r.emissionFactorsSource}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">
                    {r.assumptions ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deleteRecord(r.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
