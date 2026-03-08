"use client";

import { useEffect, useState } from "react";

interface Category {
  id: string;
  code: string;
  name: string;
  material: boolean;
  materialityReason: string | null;
}

interface Scope3RecordWithRelations {
  id: string;
  periodYear: number;
  valueTco2e: number;
  calculationMethod: string;
  dataSource: string;
  confidence: number;
  supplier: { name: string } | null;
  category: { code: string; name: string };
}

export default function Scope3Client() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [records, setRecords] = useState<Scope3RecordWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = async () => {
    const [catRes, recRes] = await Promise.all([
      fetch("/api/scope-3/categories"),
      fetch("/api/scope-3/records"),
    ]);
    setCategories((await catRes.json()) as Category[]);
    setRecords((await recRes.json()) as Scope3RecordWithRelations[]);
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      await loadAll();
    };
    void init();
  }, []);

  const handleToggleMaterial = async (cat: Category) => {
    try {
      await fetch(`/api/scope-3/categories/${cat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ material: !cat.material }),
      });
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm("Delete this record?")) return;
    await fetch(`/api/scope-3/records/${id}`, { method: "DELETE" });
    await loadAll();
  };

  if (loading) return <p className="text-gray-500">Loading…</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">Scope 3 — Value Chain</h1>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>
      )}

      {/* Categories */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          Categories &amp; Materiality
        </h2>
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Code</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Material</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-medium">{cat.code}</td>
                  <td className="px-4 py-3">{cat.name}</td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={cat.material}
                      onChange={() => void handleToggleMaterial(cat)}
                      className="accent-green-700 w-4 h-4"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Records */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Records</h2>
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Year</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Supplier</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Category</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">tCO₂e</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Method</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Confidence</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{r.periodYear}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {r.supplier?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-medium text-green-800 bg-green-50 px-1.5 py-0.5 rounded">
                      {r.category.code}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono">{r.valueTco2e.toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-600">{r.calculationMethod}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium ${
                        r.confidence >= 0.7
                          ? "text-green-700"
                          : r.confidence >= 0.5
                            ? "text-yellow-700"
                            : "text-red-700"
                      }`}
                    >
                      {(r.confidence * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => void handleDeleteRecord(r.id)}
                      className="text-red-600 hover:underline text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                    No records yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
