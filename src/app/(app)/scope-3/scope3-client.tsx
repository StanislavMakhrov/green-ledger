"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  calculationMethod: "spend_based" | "activity_based" | "supplier_specific";
  emissionFactorSource: string;
  dataSource: "supplier_form" | "csv_import" | "proxy";
  assumptions: string | null;
  confidence: number;
  category: Scope3Category;
  supplier: { id: string; name: string } | null;
}

interface NewRecordForm {
  categoryId: string;
  periodYear: string;
  valueTco2e: string;
  calculationMethod: "spend_based" | "activity_based" | "supplier_specific";
  emissionFactorSource: string;
  dataSource: "supplier_form" | "csv_import" | "proxy";
  assumptions: string;
  confidence: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Scope3Client({
  initialCategories,
  initialRecords,
}: {
  initialCategories: Scope3Category[];
  initialRecords: Scope3Record[];
}) {
  const [activeTab, setActiveTab] = useState<"categories" | "records">(
    "categories"
  );
  const [categories, setCategories] =
    useState<Scope3Category[]>(initialCategories);
  const [records, setRecords] = useState<Scope3Record[]>(initialRecords);

  const loadCategories = useCallback(async () => {
    const res = await fetch("/api/scope3/categories");
    const json = (await res.json()) as { data: Scope3Category[] };
    setCategories(json.data);
  }, []);

  const loadRecords = useCallback(async () => {
    const res = await fetch("/api/scope3/records");
    const json = (await res.json()) as { data: Scope3Record[] };
    setRecords(json.data);
  }, []);

  useEffect(() => {
    void loadCategories();
    void loadRecords();
  }, [loadCategories, loadRecords]);

  const total = records.reduce((sum, r) => sum + r.valueTco2e, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Scope 3 Emissions</h1>
        <p className="text-gray-500 mt-1">
          Upstream and downstream indirect emissions across the value chain
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("categories")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "categories"
              ? "bg-white text-green-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Categories
        </button>
        <button
          onClick={() => setActiveTab("records")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "records"
              ? "bg-white text-green-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Records ({records.length})
        </button>
      </div>

      {activeTab === "categories" && (
        <CategoriesSection
          categories={categories}
          onRefresh={loadCategories}
        />
      )}
      {activeTab === "records" && (
        <RecordsSection
          categories={categories}
          records={records}
          total={total}
          onRefresh={loadRecords}
        />
      )}
    </div>
  );
}

// ─── Categories Section ───────────────────────────────────────────────────────

function CategoriesSection({
  categories,
  onRefresh,
}: {
  categories: Scope3Category[];
  onRefresh: () => Promise<void>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editReason, setEditReason] = useState("");

  async function handleToggleMaterial(cat: Scope3Category) {
    await fetch(`/api/scope3/categories/${cat.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ material: !cat.material }),
    });
    await onRefresh();
  }

  async function handleSaveReason(catId: string) {
    await fetch(`/api/scope3/categories/${catId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        material: categories.find((c) => c.id === catId)?.material ?? false,
        materialityReason: editReason,
      }),
    });
    setEditingId(null);
    await onRefresh();
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-600 w-16">Code</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Category Name</th>
            <th className="text-center px-4 py-3 font-medium text-gray-600 w-24">Material</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Materiality Reason</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {categories.map((cat) => (
            <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-mono text-xs text-gray-500">{cat.code}</td>
              <td className="px-4 py-3 text-gray-800">{cat.name}</td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => void handleToggleMaterial(cat)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${
                    cat.material ? "bg-green-500" : "bg-gray-300"
                  }`}
                  aria-label={cat.material ? "Mark as non-material" : "Mark as material"}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      cat.material ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </td>
              <td className="px-4 py-3">
                {editingId === cat.id ? (
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={editReason}
                      onChange={(e) => setEditReason(e.target.value)}
                      className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                      placeholder="Enter reason..."
                      autoFocus
                    />
                    <button
                      onClick={() => void handleSaveReason(cat.id)}
                      className="text-xs text-green-700 hover:text-green-900 font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingId(cat.id);
                      setEditReason(cat.materialityReason ?? "");
                    }}
                    className="text-gray-600 hover:text-green-700 text-xs text-left"
                  >
                    {cat.materialityReason ?? (
                      <span className="text-gray-400 italic">Click to add reason…</span>
                    )}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Records Section ──────────────────────────────────────────────────────────

function RecordsSection({
  categories,
  records,
  total,
  onRefresh,
}: {
  categories: Scope3Category[];
  records: Scope3Record[];
  total: number;
  onRefresh: () => Promise<void>;
}) {
  const EMPTY_FORM: NewRecordForm = {
    categoryId: categories[0]?.id ?? "",
    periodYear: new Date().getFullYear().toString(),
    valueTco2e: "",
    calculationMethod: "spend_based",
    emissionFactorSource: "",
    dataSource: "proxy",
    assumptions: "",
    confidence: "1",
  };

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewRecordForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this record?")) return;
    await fetch(`/api/scope3/records/${id}`, { method: "DELETE" });
    await onRefresh();
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/scope3/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: form.categoryId,
          periodYear: parseInt(form.periodYear),
          valueTco2e: parseFloat(form.valueTco2e),
          calculationMethod: form.calculationMethod,
          emissionFactorSource: form.emissionFactorSource,
          dataSource: form.dataSource,
          assumptions: form.assumptions || undefined,
          confidence: parseFloat(form.confidence),
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error);
      }
      setForm(EMPTY_FORM);
      setShowForm(false);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add record");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors text-sm font-medium"
        >
          + Add Record
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">New Scope 3 Record</h2>
          <form onSubmit={(e) => void handleAdd(e)} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} – {c.name}
                  </option>
                ))}
              </select>
            </div>
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
                Confidence (0–1) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                required
                value={form.confidence}
                onChange={(e) => setForm({ ...form, confidence: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Calculation Method *
              </label>
              <select
                value={form.calculationMethod}
                onChange={(e) =>
                  setForm({
                    ...form,
                    calculationMethod: e.target.value as NewRecordForm["calculationMethod"],
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="spend_based">Spend-based</option>
                <option value="activity_based">Activity-based</option>
                <option value="supplier_specific">Supplier-specific</option>
              </select>
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
                    dataSource: e.target.value as NewRecordForm["dataSource"],
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="supplier_form">Supplier Form</option>
                <option value="csv_import">CSV Import</option>
                <option value="proxy">Proxy</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Emission Factor Source *
              </label>
              <input
                type="text"
                required
                value={form.emissionFactorSource}
                onChange={(e) =>
                  setForm({ ...form, emissionFactorSource: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="DEFRA 2024"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assumptions (optional)
              </label>
              <textarea
                value={form.assumptions}
                onChange={(e) => setForm({ ...form, assumptions: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={2}
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
                  setForm(EMPTY_FORM);
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {records.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg">No Scope 3 records yet.</p>
            <p className="text-sm mt-1">Add records or use the public supplier form.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Supplier</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Year</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">tCO₂e</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Method</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Source</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Conf.</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-800">
                    <span className="font-mono text-xs text-gray-400">{r.category.code}</span>{" "}
                    <span className="truncate">{r.category.name}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {r.supplier?.name ?? <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.periodYear}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {r.valueTco2e.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">
                      {r.calculationMethod}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                      {r.dataSource}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {r.confidence.toFixed(1)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => void handleDelete(r.id)}
                      className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-green-50 border-t-2 border-green-200">
              <tr>
                <td colSpan={3} className="px-4 py-3 font-semibold text-gray-700">
                  Total
                </td>
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
