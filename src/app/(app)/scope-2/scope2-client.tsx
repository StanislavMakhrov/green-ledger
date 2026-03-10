"use client";

import { useState, useEffect, useCallback } from "react";

interface Scope2Record {
  id: string;
  periodYear: number;
  valueTco2e: number;
  calculationMethod: string;
  emissionFactorsSource: string;
  dataSource: "manual" | "csv_import";
  assumptions: string | null;
  createdAt: string;
}

interface NewRecordForm {
  periodYear: string;
  valueTco2e: string;
  calculationMethod: string;
  emissionFactorsSource: string;
  dataSource: "manual" | "csv_import";
  assumptions: string;
}

const EMPTY_FORM: NewRecordForm = {
  periodYear: new Date().getFullYear().toString(),
  valueTco2e: "",
  calculationMethod: "",
  emissionFactorsSource: "",
  dataSource: "manual",
  assumptions: "",
};

export default function Scope2Client({
  reportingYear,
  initialRecords,
}: {
  reportingYear: number;
  initialRecords: Scope2Record[];
}) {
  const [records, setRecords] = useState<Scope2Record[]>(initialRecords);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewRecordForm>({ ...EMPTY_FORM, periodYear: reportingYear.toString() });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/scope2");
    const json = (await res.json()) as { data: Scope2Record[] };
    setRecords(json.data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const total = records.reduce((sum, r) => sum + r.valueTco2e, 0);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/scope2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodYear: parseInt(form.periodYear),
          valueTco2e: parseFloat(form.valueTco2e),
          calculationMethod: form.calculationMethod,
          emissionFactorsSource: form.emissionFactorsSource,
          dataSource: form.dataSource,
          assumptions: form.assumptions || undefined,
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error);
      }
      setForm({ ...EMPTY_FORM, periodYear: reportingYear.toString() });
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add record");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Scope 2 Emissions</h1>
          <p className="text-gray-500 mt-1">
            Indirect emissions from purchased electricity, steam, heat, and cooling
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors text-sm font-medium"
        >
          + Add Record
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">New Scope 2 Record</h2>
          <form onSubmit={(e) => void handleAdd(e)} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
              <input
                type="number"
                required
                value={form.periodYear}
                onChange={(e) => setForm({ ...form, periodYear: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Value (tCO₂e) *
              </label>
              <input
                type="number"
                step="any"
                required
                value={form.valueTco2e}
                onChange={(e) => setForm({ ...form, valueTco2e: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Calculation Method *
              </label>
              <input
                type="text"
                required
                value={form.calculationMethod}
                onChange={(e) =>
                  setForm({ ...form, calculationMethod: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Market-based"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Emission Factors Source *
              </label>
              <input
                type="text"
                required
                value={form.emissionFactorsSource}
                onChange={(e) =>
                  setForm({ ...form, emissionFactorsSource: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="IEA 2024"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Source *
              </label>
              <select
                value={form.dataSource}
                onChange={(e) =>
                  setForm({
                    ...form,
                    dataSource: e.target.value as "manual" | "csv_import",
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="manual">Manual</option>
                <option value="csv_import">CSV Import</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assumptions (optional)
              </label>
              <textarea
                value={form.assumptions}
                onChange={(e) => setForm({ ...form, assumptions: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={2}
                placeholder="Any assumptions made..."
              />
            </div>
            {error && <p className="col-span-2 text-sm text-red-600">{error}</p>}
            <div className="col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Record"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setForm({ ...EMPTY_FORM, periodYear: reportingYear.toString() });
                  setError(null);
                }}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Records Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {records.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg">No Scope 2 records yet.</p>
            <p className="text-sm mt-1">Add your first record above.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Year</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">tCO₂e</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Method</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">EF Source</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Data Source</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Assumptions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-700">{r.periodYear}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {r.valueTco2e.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.calculationMethod}</td>
                  <td className="px-4 py-3 text-gray-600">{r.emissionFactorsSource}</td>
                  <td className="px-4 py-3">
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                      {r.dataSource}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">
                    {r.assumptions ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-green-50 border-t-2 border-green-200">
              <tr>
                <td className="px-4 py-3 font-semibold text-gray-700">Total</td>
                <td className="px-4 py-3 text-right font-bold text-green-700">
                  {total.toFixed(2)}
                </td>
                <td colSpan={4} className="px-4 py-3 text-sm text-gray-500">
                  tCO₂e
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
