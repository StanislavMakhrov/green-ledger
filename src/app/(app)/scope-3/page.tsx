"use client";

import { useEffect, useState } from "react";

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
  dataSource: string;
  confidence: number;
  category: Scope3Category | null;
  supplier: { name: string } | null;
}

export default function Scope3Page() {
  const [categories, setCategories] = useState<Scope3Category[]>([]);
  const [records, setRecords] = useState<Scope3Record[]>([]);

  const loadCats = () => fetch("/api/scope3/categories").then((r) => r.json()).then(setCategories);
  const loadRecs = () => fetch("/api/scope3/records").then((r) => r.json()).then(setRecords);

  useEffect(() => {
    void loadCats();
    void loadRecs();
  }, []);

  const toggleMaterial = async (cat: Scope3Category) => {
    await fetch(`/api/scope3/categories/${cat.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ material: !cat.material }),
    });
    void loadCats();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this record?")) return;
    await fetch(`/api/scope3/records/${id}`, { method: "DELETE" });
    void loadRecs();
  };

  const total = records.reduce((s, r) => s + r.valueTco2e, 0);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Scope 3 — Value Chain Emissions</h2>
      <p className="text-sm text-gray-500 mb-6">Total: {total.toFixed(2)} tCO₂e</p>

      <h3 className="text-lg font-semibold mb-3 text-gray-700">Category Materiality</h3>
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead className="bg-green-700 text-white">
            <tr>
              <th className="text-left p-3">Code</th>
              <th className="text-left p-3">Category</th>
              <th className="text-left p-3">Material?</th>
              <th className="text-left p-3">Toggle</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-mono">{c.code}</td>
                <td className="p-3">{c.name}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    c.material ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                  }`}>
                    {c.material ? "✅ Material" : "—"}
                  </span>
                </td>
                <td className="p-3">
                  <button
                    onClick={() => { void toggleMaterial(c); }}
                    className="text-blue-600 hover:underline text-xs"
                  >
                    {c.material ? "Mark non-material" : "Mark material"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="text-lg font-semibold mb-3 text-gray-700">Records</h3>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-blue-700 text-white">
            <tr>
              <th className="text-left p-3">Year</th>
              <th className="text-left p-3">Category</th>
              <th className="text-left p-3">Supplier</th>
              <th className="text-left p-3">tCO₂e</th>
              <th className="text-left p-3">Method</th>
              <th className="text-left p-3">Confidence</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{r.periodYear}</td>
                <td className="p-3">{r.category?.code ?? "—"}: {r.category?.name ?? "—"}</td>
                <td className="p-3">{r.supplier?.name ?? "—"}</td>
                <td className="p-3 font-mono">{r.valueTco2e.toFixed(2)}</td>
                <td className="p-3">{r.calculationMethod}</td>
                <td className="p-3">{(r.confidence * 100).toFixed(0)}%</td>
                <td className="p-3">
                  <button onClick={() => { void handleDelete(r.id); }} className="text-red-600 hover:underline text-xs">Delete</button>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr><td colSpan={7} className="p-6 text-center text-gray-500">No records yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
