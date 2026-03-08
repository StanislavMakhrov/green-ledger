/**
 * Suppliers page — CRUD list with tokenized public form link generation.
 *
 * Client component: uses useState/useEffect for the form and API calls.
 *
 * Related spec: docs/spec.md §"Supplier"
 */
'use client'

import { useState, useEffect, useCallback } from 'react'

interface Supplier {
  id: string
  name: string
  country: string
  sector: string
  contactEmail: string
  publicFormToken: string
  status: string
}

const emptyForm = { name: '', country: 'DE', sector: '', contactEmail: '' }

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const loadSuppliers = useCallback(async () => {
    const res = await fetch('/api/suppliers')
    const data = await res.json() as Supplier[]
    setSuppliers(data)
    setLoading(false)
  }, [])

  useEffect(() => { void loadSuppliers() }, [loadSuppliers])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setForm(emptyForm)
    setSaving(false)
    void loadSuppliers()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this supplier?')) return
    await fetch(`/api/suppliers/${id}`, { method: 'DELETE' })
    void loadSuppliers()
  }

  const handleRegenerateToken = async (id: string) => {
    if (!confirm('Regenerate token? The old link will stop working.')) return
    await fetch(`/api/suppliers/${id}/token`, { method: 'POST' })
    void loadSuppliers()
  }

  const handleCopyLink = async (token: string, id: string) => {
    const link = `${appUrl}/public/supplier/${token}`
    await navigator.clipboard.writeText(link)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Suppliers</h1>

      {/* Add supplier form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Add Supplier</h2>
        <form onSubmit={handleAdd} className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
            <input
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Acme GmbH"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Country</label>
            <input
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              placeholder="DE"
              maxLength={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Sector</label>
            <input
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              value={form.sector}
              onChange={(e) => setForm({ ...form, sector: e.target.value })}
              placeholder="Manufacturing"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Contact Email</label>
            <input
              required
              type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              placeholder="esg@supplier.com"
            />
          </div>
          <div className="col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </div>

      {/* Suppliers table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Country</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Sector</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Public Form</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
            ) : suppliers.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No suppliers yet.</td></tr>
            ) : (
              suppliers.map((s) => (
                <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                  <td className="px-4 py-3 text-gray-600">{s.country}</td>
                  <td className="px-4 py-3 text-gray-600">{s.sector}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => void handleCopyLink(s.publicFormToken, s.id)}
                        className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
                      >
                        {copiedId === s.id ? '✓ Copied!' : '🔗 Copy Link'}
                      </button>
                      <button
                        onClick={() => void handleRegenerateToken(s.id)}
                        className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded hover:bg-orange-100"
                      >
                        🔄 Regen
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => void handleDelete(s.id)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
