"use client";

import { useEffect, useState } from "react";

interface Scope1Record {
  id: string;
  periodYear: number;
  valueTco2e: number;
  calculationMethod: string;
  emissionFactorsSource: string;
  dataSource: string;
  assumptions: string | null;
  createdAt: string;
}

export default function Scope1Page() {
  const [records, setRecords] = useState<Scope1Record[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    periodYear: 2024,
    valueTco2e: "",
    calculationMethod: "",
    emissionFactorsSource: "",
    assumptions: "",
  });

  const load = () =>
    fetch("/api/scope1").then((r) => r.json()).then(setRecords);

  useEffect(() => { void load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/scope1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, valueTco2e: parseFloat(form.valueTco2e), dataSource: "manual" }),
    });
    setShowForm(false);
    setForm({ periodYear: 2024, valueTco2e: "", calculationMethod: "", emissionFactorsSource: "", assumptions: "" });
    void load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this record?")) return;
    await fetch(`/api/scope1/${id}`, { method: "DELETE" });
    void load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Scope 1 — Direct Emissions</h2>
          <p className="text-sm text-gray-500 mt-1">
            Total: {records.reduce((s, r) => s + r.valueTco2e, 0).toFixed(2)} tCO₂e
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800"
        >
          + Add Record
        </button>
      </div>

      {showForm && (
        <form onSubmit={(e) => { void handleCreate(e); }} className="bg-white p-6 rounded-lg shadow mb-6 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Year</label>
            <input type="number" required value={form.periodYear}
              onChange={(e) => setForm({ ...form, periodYear: parseInt(e.target.value) })}
              className="border rounded px-3 py-2 w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Value (tCO₂e)</label>
            <input type="number" step="0.01" required value={form.valueTco2e}
              onChange={(e) => setForm({ ...form, valueTco2e: e.target.value })}
              className="border rounded px-3 py-2 w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Calculation Method</label>
            <input required value={form.calculationMethod}
              onChange={(e) => setForm({ ...form, calculationMethod: e.target.value })}
              className="border rounded px-3 py-2 w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Emission Factors Source</label>
            <input required value={form.emissionFactorsSource}
              onChange={(e) => setForm({ ...form, emissionFactorsSource: e.target.value })}
              className="border rounded px-3 py-2 w-full" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Assumptions (optional)</label>
            <textarea value={form.assumptions}
              onChange={(e) => setForm({ ...form, assumptions: e.target.value })}
              className="border rounded px-3 py-2 w-full" rows={2} />
          </div>
          <div className="col-span-2 flex gap-3">
            <button type="submit" className="bg-green-700 text-white px-4 py-2 rounded-md">Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 px-4 py-2 rounded-md">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-red-600 text-white">
            <tr>
              <th className="text-left p-3">Year</th>
              <th className="text-left p-3">tCO₂e</th>
              <th className="text-left p-3">Method</th>
              <th className="text-left p-3">Source</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{r.periodYear}</td>
                <td className="p-3 font-mono">{r.valueTco2e.toFixed(2)}</td>
                <td className="p-3">{r.calculationMethod}</td>
                <td className="p-3">{r.emissionFactorsSource}</td>
                <td className="p-3">
                  <button onClick={() => { void handleDelete(r.id); }} className="text-red-600 hover:underline text-xs">Delete</button>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-gray-500">No records yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
