"use client";

import { useEffect, useState } from "react";

interface Category {
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
  dataSource: string;
  confidence: number;
  assumptions: string | null;
  supplier: { name: string } | null;
  category: { code: string; name: string };
}

interface Supplier {
  id: string;
  name: string;
}

/** Displays the 15 ESRS E1 categories with materiality toggles. */
function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = () =>
    fetch("/api/scope3/categories")
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const toggleMaterial = async (cat: Category) => {
    setSaving(cat.id);
    await fetch(`/api/scope3/categories/${cat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ material: !cat.material, materialityReason: cat.materialityReason }),
    });
    await load();
    setSaving(null);
  };

  const updateReason = async (cat: Category, reason: string) => {
    await fetch(`/api/scope3/categories/${cat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ material: cat.material, materialityReason: reason }),
    });
    await load();
  };

  if (loading) return <p className="text-gray-400 animate-pulse">Loading…</p>;

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Code</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Category</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Material</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Reason</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {categories.map((cat) => (
            <tr key={cat.id} className={cat.material ? "bg-emerald-50" : ""}>
              <td className="px-4 py-3 font-mono font-semibold text-emerald-700">
                {cat.code}
              </td>
              <td className="px-4 py-3">{cat.name}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => toggleMaterial(cat)}
                  disabled={saving === cat.id}
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    cat.material
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white text-gray-500 border-gray-300 hover:border-emerald-400"
                  } disabled:opacity-50`}
                >
                  {cat.material ? "✓ Material" : "Not material"}
                </button>
              </td>
              <td className="px-4 py-3">
                <input
                  className="border-b border-dashed border-gray-300 text-xs w-full bg-transparent focus:outline-none focus:border-emerald-500"
                  placeholder="Add reason…"
                  defaultValue={cat.materialityReason ?? ""}
                  onBlur={(e) => {
                    if (e.target.value !== (cat.materialityReason ?? "")) {
                      updateReason(cat, e.target.value);
                    }
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Displays Scope 3 records and add-record form. */
function RecordsTab() {
  const [records, setRecords] = useState<Scope3Record[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    categoryId: "",
    supplierId: "",
    valueTco2e: "",
    calculationMethod: "spend_based",
    emissionFactorSource: "",
    dataSource: "proxy",
    confidence: "0.7",
    assumptions: "",
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [recs, cats, sups] = await Promise.all([
        fetch("/api/scope3/records").then((r) => r.json()),
        fetch("/api/scope3/categories").then((r) => r.json()),
        fetch("/api/suppliers").then((r) => r.json()),
      ]);
      setRecords(Array.isArray(recs) ? recs : []);
      setCategories(Array.isArray(cats) ? cats : []);
      setSuppliers(Array.isArray(sups) ? sups : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/scope3/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        valueTco2e: Number(form.valueTco2e),
        confidence: Number(form.confidence),
        supplierId: form.supplierId || undefined,
      }),
    });
    setForm({
      categoryId: "",
      supplierId: "",
      valueTco2e: "",
      calculationMethod: "spend_based",
      emissionFactorSource: "",
      dataSource: "proxy",
      confidence: "0.7",
      assumptions: "",
    });
    setSaving(false);
    load();
  };

  const deleteRecord = async (id: string) => {
    if (!confirm("Delete this record?")) return;
    await fetch(`/api/scope3/records/${id}`, { method: "DELETE" });
    load();
  };

  if (loading) return <p className="text-gray-400 animate-pulse">Loading…</p>;

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border p-6 shadow-sm mb-6"
      >
        <h3 className="text-base font-semibold mb-4 text-gray-800">Add Record</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Category *</label>
            <select
              className="border rounded-lg px-3 py-2 text-sm w-full"
              required
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">Select category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Supplier (optional)</label>
            <select
              className="border rounded-lg px-3 py-2 text-sm w-full"
              value={form.supplierId}
              onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
            >
              <option value="">— none —</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Value (tCO₂e) *</label>
            <input
              className="border rounded-lg px-3 py-2 text-sm w-full"
              type="number"
              step="0.01"
              required
              value={form.valueTco2e}
              onChange={(e) => setForm({ ...form, valueTco2e: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Confidence (0–1)</label>
            <input
              className="border rounded-lg px-3 py-2 text-sm w-full"
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={form.confidence}
              onChange={(e) => setForm({ ...form, confidence: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Data Source</label>
            <select
              className="border rounded-lg px-3 py-2 text-sm w-full"
              value={form.dataSource}
              onChange={(e) => setForm({ ...form, dataSource: e.target.value })}
            >
              <option value="proxy">proxy</option>
              <option value="supplier_form">supplier_form</option>
              <option value="csv_import">csv_import</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Emission Factor Source</label>
            <input
              className="border rounded-lg px-3 py-2 text-sm w-full"
              placeholder="e.g. DEFRA 2023"
              value={form.emissionFactorSource}
              onChange={(e) => setForm({ ...form, emissionFactorSource: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500 block mb-1">Assumptions</label>
            <input
              className="border rounded-lg px-3 py-2 text-sm w-full"
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

      {records.length === 0 ? (
        <p className="text-gray-400">No Scope 3 records yet.</p>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Category</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Supplier</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">tCO₂e</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Source</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Confidence</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {records.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-medium">
                    {r.category.code} {r.category.name}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{r.supplier?.name ?? "—"}</td>
                  <td className="px-4 py-3 font-mono">
                    {r.valueTco2e.toLocaleString("en-DE", { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{r.dataSource}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {(r.confidence * 100).toFixed(0)}%
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

export default function Scope3Page() {
  const [tab, setTab] = useState<"categories" | "records">("categories");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Scope 3 — Value Chain Emissions
      </h1>
      <div className="flex gap-2 mb-6">
        {(["categories", "records"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium border transition-colors ${
              tab === t
                ? "bg-emerald-700 text-white border-emerald-700"
                : "bg-white text-gray-600 border-gray-200 hover:border-emerald-400"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {tab === "categories" ? <CategoriesTab /> : <RecordsTab />}
    </div>
  );
}
