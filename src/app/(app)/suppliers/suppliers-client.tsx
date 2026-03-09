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

const emptyForm = { name: "", country: "DE", sector: "", contactEmail: "" };

export default function SuppliersClient() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/suppliers");
      setSuppliers(await res.json());
      setLoading(false);
    }
    void load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm(emptyForm);
    const res = await fetch("/api/suppliers");
    setSuppliers(await res.json());
  }

  async function handleRefreshToken(id: string) {
    await fetch(`/api/suppliers/${id}/refresh-token`, { method: "POST" });
    const res = await fetch("/api/suppliers");
    setSuppliers(await res.json());
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this supplier?")) return;
    await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
    const res = await fetch("/api/suppliers");
    setSuppliers(await res.json());
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/public/supplier/${token}`;
    void navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Suppliers</h1>
      <form onSubmit={handleCreate} className="mb-8 bg-white p-4 rounded shadow space-y-3">
        <h2 className="font-semibold text-gray-700">Add Supplier</h2>
        <div className="grid grid-cols-2 gap-3">
          <input className="border rounded px-3 py-2 text-sm" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="border rounded px-3 py-2 text-sm" placeholder="Country (e.g. DE)" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} required />
          <input className="border rounded px-3 py-2 text-sm" placeholder="Sector" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} required />
          <input className="border rounded px-3 py-2 text-sm" placeholder="Contact Email" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} required />
        </div>
        <button type="submit" className="bg-green-700 text-white px-4 py-2 rounded text-sm hover:bg-green-800">Add Supplier</button>
      </form>

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <div className="bg-white rounded shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Country</th>
                <th className="px-4 py-3 text-left">Sector</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3">{s.country}</td>
                  <td className="px-4 py-3">{s.sector}</td>
                  <td className="px-4 py-3">{s.contactEmail}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${s.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    <button type="button" onClick={() => copyLink(s.publicFormToken)} className="text-blue-600 hover:underline text-xs">
                      {copied === s.publicFormToken ? "Copied!" : "Copy Link"}
                    </button>
                    <button type="button" onClick={() => void handleRefreshToken(s.id)} className="text-yellow-600 hover:underline text-xs">
                      Refresh Token
                    </button>
                    <button type="button" onClick={() => void handleDelete(s.id)} className="text-red-600 hover:underline text-xs">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {suppliers.length === 0 && <p className="px-4 py-6 text-gray-400 text-sm">No suppliers yet.</p>}
        </div>
      )}
    </div>
  );
}
