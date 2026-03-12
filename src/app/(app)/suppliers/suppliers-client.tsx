"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Supplier {
  id: string;
  name: string;
  country: string;
  sector: string;
  contactEmail: string;
  publicFormToken: string;
  status: "active" | "inactive";
}

interface NewSupplierForm {
  name: string;
  country: string;
  sector: string;
  contactEmail: string;
}

const EMPTY_FORM: NewSupplierForm = {
  name: "",
  country: "",
  sector: "",
  contactEmail: "",
};

export default function SuppliersClient({
  initialSuppliers,
}: {
  initialSuppliers: Supplier[];
}) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewSupplierForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ── Selection state ───────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Derived selection values (not stored in state)
  const allSelected =
    suppliers.length > 0 && selectedIds.size === suppliers.length;
  const someSelected =
    selectedIds.size > 0 && selectedIds.size < suppliers.length;

  // Ref to set the indeterminate DOM property on the "select all" checkbox
  const selectAllRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  const load = useCallback(async () => {
    const res = await fetch("/api/suppliers");
    const json = (await res.json()) as { data: Supplier[] };
    setSuppliers(json.data);
    // Clear selection after any data refresh to prevent stale selections
    setSelectedIds(new Set());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error);
      }
      setForm(EMPTY_FORM);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add supplier");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(supplier: Supplier) {
    const newStatus = supplier.status === "active" ? "inactive" : "active";
    const res = await fetch(`/api/suppliers/${supplier.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) await load();
  }

  async function handleRefreshToken(supplierId: string) {
    const res = await fetch(`/api/suppliers/${supplierId}/token`, {
      method: "POST",
    });
    if (res.ok) await load();
  }

  async function handleDelete(supplierId: string, supplierName: string) {
    if (!confirm(`Delete supplier "${supplierName}"? This cannot be undone.`))
      return;
    const res = await fetch(`/api/suppliers/${supplierId}`, {
      method: "DELETE",
    });
    if (res.ok) await load();
  }

  async function handleCopyLink(supplier: Supplier) {
    const url = `${window.location.origin}/public/supplier/${supplier.publicFormToken}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(supplier.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // ── Selection handlers ────────────────────────────────────────────────────

  function handleToggleSelect(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  }

  function handleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(suppliers.map((s) => s.id)));
    }
  }

  // ── Export handler ────────────────────────────────────────────────────────

  async function handleExport() {
    if (selectedIds.size === 0) {
      setExportError("Please select at least one supplier to export.");
      return;
    }
    setExporting(true);
    setExportError(null);
    try {
      const ids = Array.from(selectedIds).join(",");
      const params = new URLSearchParams({ ids });
      const res = await fetch(`/api/suppliers/export?${params.toString()}`);
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Export request failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      // Derive filename from Content-Disposition header if present, else use fallback
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = /filename="([^"]+)"/.exec(disposition);
      a.download = match ? match[1] : `suppliers-export.xlsx`;
      a.href = url;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      setExportError("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-500 mt-1">Manage supplier emission data collection</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Selection counter */}
          <span className="text-sm text-gray-500">
            {selectedIds.size} supplier(s) selected
          </span>
          {/* Export to Excel button */}
          <button
            onClick={() => void handleExport()}
            disabled={selectedIds.size === 0 || exporting}
            className="border border-green-700 text-green-700 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? "Exporting…" : "⬇ Export to Excel"}
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors text-sm font-medium"
          >
            + Add Supplier
          </button>
        </div>
      </div>

      {/* Export error message */}
      {exportError && (
        <p className="mb-4 text-sm text-red-600">{exportError}</p>
      )}

      {/* Add Supplier Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">New Supplier</h2>
          <form onSubmit={(e) => void handleAdd(e)} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Acme Corp"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country *
              </label>
              <input
                type="text"
                required
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="DE"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sector *
              </label>
              <input
                type="text"
                required
                value={form.sector}
                onChange={(e) => setForm({ ...form, sector: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Manufacturing"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Email *
              </label>
              <input
                type="email"
                required
                value={form.contactEmail}
                onChange={(e) =>
                  setForm({ ...form, contactEmail: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="contact@acme.com"
              />
            </div>
            {error && (
              <p className="col-span-2 text-sm text-red-600">{error}</p>
            )}
            <div className="col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Supplier"}
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

      {/* Suppliers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {suppliers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg">No suppliers yet.</p>
            <p className="text-sm mt-1">Add your first supplier above.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    ref={selectAllRef}
                    aria-label="Select all suppliers"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-green-700 focus:ring-green-500"
                  />
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Country</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Sector</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Form Link</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {suppliers.map((s) => (
                <tr
                  key={s.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    selectedIds.has(s.id) ? "bg-green-50" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Select ${s.name}`}
                      checked={selectedIds.has(s.id)}
                      onChange={() => handleToggleSelect(s.id)}
                      className="h-4 w-4 rounded border-gray-300 text-green-700 focus:ring-green-500"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3 text-gray-600">{s.country}</td>
                  <td className="px-4 py-3 text-gray-600">{s.sector}</td>
                  <td className="px-4 py-3 text-gray-600">{s.contactEmail}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => void handleToggleStatus(s)}
                      className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                        s.status === "active"
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {s.status}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => void handleCopyLink(s)}
                        className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                        title="Copy form link"
                      >
                        {copiedId === s.id ? "✓ Copied" : "📋 Copy"}
                      </button>
                      <button
                        onClick={() => void handleRefreshToken(s.id)}
                        className="text-xs bg-yellow-50 text-yellow-700 hover:bg-yellow-100 px-2 py-1 rounded transition-colors"
                        title="Regenerate token"
                      >
                        🔄 Refresh
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => void handleDelete(s.id, s.name)}
                      className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
