"use client";

import { useEffect, useState } from "react";

interface Supplier {
  id: string;
  name: string;
  country: string;
  sector: string;
  contactEmail: string;
  publicFormToken: string;
  status: string;
}

function AddSupplierForm({ onAdded }: { onAdded: () => void }) {
  const [form, setForm] = useState({
    name: "",
    country: "DE",
    sector: "",
    contactEmail: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ name: "", country: "DE", sector: "", contactEmail: "" });
    setSaving(false);
    onAdded();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border p-6 shadow-sm mb-6"
    >
      <h2 className="text-base font-semibold mb-4 text-gray-800">Add Supplier</h2>
      <div className="grid grid-cols-2 gap-4">
        <input
          className="border rounded-lg px-3 py-2 text-sm"
          placeholder="Name *"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className="border rounded-lg px-3 py-2 text-sm"
          placeholder="Country (e.g. DE)"
          value={form.country}
          onChange={(e) => setForm({ ...form, country: e.target.value })}
        />
        <input
          className="border rounded-lg px-3 py-2 text-sm"
          placeholder="Sector"
          value={form.sector}
          onChange={(e) => setForm({ ...form, sector: e.target.value })}
        />
        <input
          className="border rounded-lg px-3 py-2 text-sm"
          placeholder="Contact Email"
          type="email"
          value={form.contactEmail}
          onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="mt-4 bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-emerald-800 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Add Supplier"}
      </button>
    </form>
  );
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/suppliers");
      const d = await r.json();
      setSuppliers(Array.isArray(d) ? d : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const refreshToken = async (id: string) => {
    await fetch(`/api/suppliers/${id}/refresh-token`, { method: "POST" });
    load();
  };

  const deleteSupplier = async (id: string) => {
    if (!confirm("Delete this supplier?")) return;
    await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
    load();
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/public/supplier/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Suppliers</h1>
      <AddSupplierForm onAdded={load} />

      {loading ? (
        <p className="text-gray-400 animate-pulse">Loading…</p>
      ) : suppliers.length === 0 ? (
        <p className="text-gray-400">No suppliers yet.</p>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Country</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Sector</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Email</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {suppliers.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3">{s.country}</td>
                  <td className="px-4 py-3">{s.sector}</td>
                  <td className="px-4 py-3">{s.contactEmail}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        s.status === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2 flex-wrap">
                    <button
                      onClick={() => copyLink(s.publicFormToken)}
                      className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded hover:bg-blue-100"
                    >
                      {copied === s.publicFormToken ? "Copied!" : "Copy Link"}
                    </button>
                    <button
                      onClick={() => refreshToken(s.id)}
                      className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded hover:bg-amber-100"
                    >
                      Refresh Token
                    </button>
                    <button
                      onClick={() => deleteSupplier(s.id)}
                      className="text-xs bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded hover:bg-red-100"
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
