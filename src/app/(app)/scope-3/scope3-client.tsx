"use client";

import { useState } from "react";

interface Scope3Category {
  id: string;
  code: string;
  name: string;
  material: boolean;
  materialityReason: string | null;
}

interface Scope3Record {
  id: string;
  periodYear: number;
  valueTco2e: number;
  calculationMethod: string;
  emissionFactorSource: string;
  dataSource: string;
  confidence: number;
  categoryId: string;
  createdAt: string;
}

interface Scope3ClientProps {
  initialCategories: Scope3Category[];
  initialRecords: Scope3Record[];
  defaultYear: number;
}

export function Scope3Client({
  initialCategories,
  initialRecords,
  defaultYear,
}: Scope3ClientProps) {
  const [categories, setCategories] =
    useState<Scope3Category[]>(initialCategories);
  const [records, setRecords] = useState<Scope3Record[]>(initialRecords);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    valueTco2e: "",
    calculationMethod: "",
    emissionFactorSource: "",
    assumptions: "",
    confidence: "0.8",
    categoryId: initialCategories[0]?.id ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggleMaterial(cat: Scope3Category) {
    const newVal = !cat.material;
    try {
      const res = await fetch("/api/scope3/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cat.id, material: newVal }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const updated = (await res.json()) as Scope3Category;
      setCategories((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error updating category");
    }
  }

  async function handleAddRecord(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/scope3", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          valueTco2e: parseFloat(form.valueTco2e),
          confidence: parseFloat(form.confidence),
          dataSource: "proxy",
          periodYear: defaultYear,
        }),
      });
      if (!res.ok) throw new Error("Failed to add record");
      const created = (await res.json()) as Scope3Record;
      setRecords((prev) => [...prev, created]);
      setForm({
        valueTco2e: "",
        calculationMethod: "",
        emissionFactorSource: "",
        assumptions: "",
        confidence: "0.8",
        categoryId: initialCategories[0]?.id ?? "",
      });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  const total = records.reduce((s, r) => s + r.valueTco2e, 0);

  function getCategoryName(catId: string) {
    return categories.find((c) => c.id === catId)?.name ?? catId;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        Scope 3 Emissions
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Value chain emissions — categories and records
      </p>

      {/* Categories section */}
      <h2 className="text-lg font-semibold text-gray-800 mb-3">
        Categories &amp; Materiality
      </h2>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead className="bg-green-50 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Code</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-center">Material</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-600">
                  {cat.code}
                </td>
                <td className="px-4 py-3">{cat.name}</td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={cat.material}
                    onChange={() => void handleToggleMaterial(cat)}
                    className="w-4 h-4 accent-green-700 cursor-pointer"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Records section */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-800">Records</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 bg-green-700 text-white rounded-md text-sm font-medium hover:bg-green-800"
        >
          {showForm ? "Cancel" : "+ Add Record"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => void handleAddRecord(e)}
          className="bg-white border border-gray-200 rounded-xl p-6 mb-6 grid grid-cols-2 gap-4"
        >
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              value={form.categoryId}
              onChange={(e) =>
                setForm((f) => ({ ...f, categoryId: e.target.value }))
              }
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
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
              Emission Factor Source
            </label>
            <input
              required
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              value={form.emissionFactorSource}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  emissionFactorSource: e.target.value,
                }))
              }
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Confidence (0–1)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="1"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              value={form.confidence}
              onChange={(e) =>
                setForm((f) => ({ ...f, confidence: e.target.value }))
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
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-right">tCO₂e</th>
              <th className="px-4 py-3 text-left">Method</th>
              <th className="px-4 py-3 text-left">Source</th>
              <th className="px-4 py-3 text-right">Confidence</th>
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
                <td className="px-4 py-3">{getCategoryName(r.categoryId)}</td>
                <td className="px-4 py-3 text-right font-mono">
                  {r.valueTco2e.toFixed(4)}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {r.calculationMethod}
                </td>
                <td className="px-4 py-3 text-gray-600">{r.dataSource}</td>
                <td className="px-4 py-3 text-right text-gray-600">
                  {(r.confidence * 100).toFixed(0)}%
                </td>
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
