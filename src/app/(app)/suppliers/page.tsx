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

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", country: "DE", sector: "", contactEmail: "" });
  const [copied, setCopied] = useState<string | null>(null);

  const load = () =>
    fetch("/api/suppliers").then((r) => r.json()).then(setSuppliers);

  useEffect(() => { void load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ name: "", country: "DE", sector: "", contactEmail: "" });
    setShowForm(false);
    void load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deactivate this supplier?")) return;
    await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
    void load();
  };

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/public/supplier/${token}`;
    void navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleRefreshToken = async (id: string) => {
    await fetch(`/api/suppliers/${id}/token`, { method: "POST" });
    void load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Suppliers</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800"
        >
          + Add Supplier
        </button>
      </div>

      {showForm && (
        <form onSubmit={(e) => { void handleCreate(e); }} className="bg-white p-6 rounded-lg shadow mb-6 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <input
              required
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
            <input
              required
              value={form.sector}
              onChange={(e) => setForm({ ...form, sector: e.target.value })}
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
            <input
              required
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <div className="col-span-2 flex gap-3">
            <button type="submit" className="bg-green-700 text-white px-4 py-2 rounded-md">Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 px-4 py-2 rounded-md">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-green-700 text-white">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Country</th>
              <th className="text-left p-3">Sector</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{s.name}</td>
                <td className="p-3">{s.country}</td>
                <td className="p-3">{s.sector}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    s.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                  }`}>
                    {s.status}
                  </span>
                </td>
                <td className="p-3 flex gap-2">
                  <button
                    onClick={() => handleCopyLink(s.publicFormToken)}
                    className="text-blue-600 hover:underline text-xs"
                    title="Copy supplier form link"
                  >
                    {copied === s.publicFormToken ? "✅ Copied!" : "📋 Copy Link"}
                  </button>
                  <button
                    onClick={() => { void handleRefreshToken(s.id); }}
                    className="text-amber-600 hover:underline text-xs"
                    title="Refresh token"
                  >
                    🔄 New Token
                  </button>
                  <button
                    onClick={() => { void handleDelete(s.id); }}
                    className="text-red-600 hover:underline text-xs"
                    title="Deactivate"
                  >
                    🗑 Deactivate
                  </button>
                </td>
              </tr>
            ))}
            {suppliers.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">
                  No suppliers yet. Add one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
