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
  category: { name: string };
  supplier: { name: string } | null;
}

export default function Scope3Page() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [records, setRecords] = useState<Scope3Record[]>([]);

  useEffect(() => {
    async function load() {
      const [catRes, recRes] = await Promise.all([
        fetch("/api/scope-3/categories"),
        fetch("/api/scope-3/records"),
      ]);
      setCategories(await catRes.json());
      setRecords(await recRes.json());
    }
    void load();
  }, []);

  async function toggleMaterial(cat: Category) {
    await fetch("/api/scope-3/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: cat.id, material: !cat.material, materialityReason: cat.materialityReason }),
    });
    const res = await fetch("/api/scope-3/categories");
    setCategories(await res.json());
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Scope 3 — Value Chain Emissions</h1>

      <h2 className="text-lg font-semibold text-gray-700 mb-3">Categories &amp; Materiality</h2>
      <div className="bg-white rounded shadow overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">Code</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Material</th>
              <th className="px-4 py-3 text-left">Reason</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-3 font-mono text-xs">{c.code}</td>
                <td className="px-4 py-3">{c.name}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => void toggleMaterial(c)}
                    className={`px-2 py-1 rounded text-xs font-medium ${c.material ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                  >
                    {c.material ? "✓ Material" : "Non-material"}
                  </button>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{c.materialityReason ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-lg font-semibold text-gray-700 mb-3">Records</h2>
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">Year</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Supplier</th>
              <th className="px-4 py-3 text-left">tCO₂e</th>
              <th className="px-4 py-3 text-left">Method</th>
              <th className="px-4 py-3 text-left">Source</th>
              <th className="px-4 py-3 text-left">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3">{r.periodYear}</td>
                <td className="px-4 py-3">{r.category.name}</td>
                <td className="px-4 py-3">{r.supplier?.name ?? "—"}</td>
                <td className="px-4 py-3 font-mono">{r.valueTco2e.toFixed(3)}</td>
                <td className="px-4 py-3">{r.calculationMethod.replace(/_/g, " ")}</td>
                <td className="px-4 py-3">{r.dataSource.replace(/_/g, " ")}</td>
                <td className="px-4 py-3">{(r.confidence * 100).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        {records.length === 0 && <p className="px-4 py-6 text-gray-400 text-sm">No Scope 3 records yet. Suppliers can submit data via their public form link.</p>}
      </div>
    </div>
  );
}
