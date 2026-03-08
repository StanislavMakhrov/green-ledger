"use client";

import { useState } from "react";

interface Supplier {
  id: string;
  name: string;
  country: string;
  sector: string;
  contactEmail: string;
  publicFormToken: string;
  status: string;
}

interface SuppliersClientProps {
  initialSuppliers: Supplier[];
}

export function SuppliersClient({ initialSuppliers }: SuppliersClientProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    country: "",
    sector: "",
    contactEmail: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function handleAddSupplier(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to add supplier");
      const created = (await res.json()) as Supplier;
      setSuppliers((prev) => [...prev, created]);
      setForm({ name: "", country: "", sector: "", contactEmail: "" });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  async function handleRefreshToken(supplierId: string) {
    setTokenError(null);
    try {
      const res = await fetch(`/api/suppliers/${supplierId}/refresh-token`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to refresh token");
      const updated = (await res.json()) as Supplier;
      setSuppliers((prev) =>
        prev.map((s) => (s.id === supplierId ? updated : s))
      );
    } catch (err) {
      setTokenError(err instanceof Error ? err.message : "Error refreshing token");
    }
  }

  function getFormLink(token: string) {
    return `${window.location.origin}/public/supplier/${token}`;
  }

  function handleCopy(token: string) {
    navigator.clipboard.writeText(getFormLink(token)).then(
      () => {
        setCopied(token);
        setTimeout(() => setCopied(null), 2000);
      },
      () => {
        setTokenError("Could not copy link. Please copy it manually.");
      }
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-sm text-gray-500">
            Manage suppliers and collect emission data
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 bg-green-700 text-white rounded-md text-sm font-medium hover:bg-green-800"
        >
          {showForm ? "Cancel" : "+ Add Supplier"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => void handleAddSupplier(e)}
          className="bg-white border border-gray-200 rounded-xl p-6 mb-6 grid grid-cols-2 gap-4"
        >
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              required
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Country
            </label>
            <input
              required
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              value={form.country}
              onChange={(e) =>
                setForm((f) => ({ ...f, country: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Sector
            </label>
            <input
              required
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              value={form.sector}
              onChange={(e) =>
                setForm((f) => ({ ...f, sector: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Contact Email
            </label>
            <input
              required
              type="email"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              value={form.contactEmail}
              onChange={(e) =>
                setForm((f) => ({ ...f, contactEmail: e.target.value }))
              }
            />
          </div>
          <div className="col-span-2 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-green-700 text-white rounded-md text-sm font-medium hover:bg-green-800 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Add Supplier"}
            </button>
          </div>
          {error && <p className="col-span-2 text-sm text-red-600">{error}</p>}
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {tokenError && (
          <p className="px-4 py-2 text-sm text-red-600 bg-red-50 border-b border-red-100">
            {tokenError}
          </p>
        )}
        <table className="w-full text-sm">
          <thead className="bg-green-50 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Country</th>
              <th className="px-4 py-3 text-left">Sector</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Form Link</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {suppliers.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  No suppliers yet.
                </td>
              </tr>
            )}
            {suppliers.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 text-gray-600">{s.country}</td>
                <td className="px-4 py-3 text-gray-600">{s.sector}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      s.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleCopy(s.publicFormToken)}
                    className="text-green-700 hover:underline text-xs"
                  >
                    {copied === s.publicFormToken ? "✓ Copied!" : "Copy link"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => void handleRefreshToken(s.id)}
                    className="text-gray-500 hover:text-gray-700 text-xs underline"
                  >
                    Refresh token
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
