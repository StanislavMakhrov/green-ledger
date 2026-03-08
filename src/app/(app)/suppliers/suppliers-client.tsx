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

interface NewSupplierForm {
  name: string;
  country: string;
  sector: string;
  contactEmail: string;
}

const emptyForm: NewSupplierForm = {
  name: "",
  country: "",
  sector: "",
  contactEmail: "",
};

export default function SuppliersClient() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewSupplierForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const loadSuppliers = async () => {
    try {
      const res = await fetch("/api/suppliers");
      if (!res.ok) throw new Error("Failed to load suppliers");
      const data = (await res.json()) as Supplier[];
      setSuppliers(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSuppliers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to create supplier");
      setForm(emptyForm);
      setShowForm(false);
      await loadSuppliers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshToken = async (id: string) => {
    try {
      const res = await fetch(`/api/suppliers/${id}/token`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to refresh token");
      await loadSuppliers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  };

  const handleCopyLink = async (token: string) => {
    const url = `${window.location.origin}/public/supplier/${token}`;
    await navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this supplier?")) return;
    try {
      await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
      await loadSuppliers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  };

  if (loading) return <p className="text-gray-500">Loading…</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Suppliers</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-800"
        >
          + Add Supplier
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="mb-6 p-4 bg-white rounded-xl border shadow-sm space-y-3"
        >
          <h2 className="font-semibold text-gray-700">New Supplier</h2>
          <div className="grid grid-cols-2 gap-3">
            {(["name", "country", "sector", "contactEmail"] as const).map(
              (field) => (
                <input
                  key={field}
                  required
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  value={form[field]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [field]: e.target.value }))
                  }
                  className="border rounded px-3 py-2 text-sm"
                />
              ),
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-green-700 text-white px-4 py-2 rounded text-sm hover:bg-green-800 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded text-sm border hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Country</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Sector</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {suppliers.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 text-gray-600">{s.country}</td>
                <td className="px-4 py-3 text-gray-600">{s.sector}</td>
                <td className="px-4 py-3 text-gray-600">{s.contactEmail}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      s.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3 space-x-2">
                  <button
                    onClick={() => void handleCopyLink(s.publicFormToken)}
                    className="text-blue-600 hover:underline text-xs"
                  >
                    {copied === s.publicFormToken ? "Copied!" : "Copy link"}
                  </button>
                  <button
                    onClick={() => void handleRefreshToken(s.id)}
                    className="text-yellow-600 hover:underline text-xs"
                  >
                    Refresh token
                  </button>
                  <button
                    onClick={() => void handleDelete(s.id)}
                    className="text-red-600 hover:underline text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {suppliers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  No suppliers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
