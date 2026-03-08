/**
 * Scope 3 page — manage categories (materiality) and records.
 *
 * Client component: uses useState/useEffect for data loading and API calls.
 *
 * Related spec: docs/spec.md §"Scope3Category", §"Scope3Record", §"Materiality"
 */
'use client'

import { useState, useEffect, useCallback } from 'react'

interface Category {
  id: string
  code: string
  name: string
  material: boolean
  materialityReason: string | null
}

interface Scope3Record {
  id: string
  periodYear: number
  valueTco2e: number
  calculationMethod: string
  dataSource: string
  confidence: number
  assumptions: string | null
  category: { code: string; name: string }
  supplier: { id: string; name: string } | null
}

interface Supplier {
  id: string
  name: string
}

const emptyForm = {
  supplierId: '',
  categoryId: '',
  periodYear: 2024,
  valueTco2e: '',
  calculationMethod: 'spend_based',
  emissionFactorSource: '',
  dataSource: 'proxy',
  assumptions: '',
  confidence: '1.0',
}

export default function Scope3Page() {
  const [tab, setTab] = useState<'records' | 'categories'>('records')
  const [categories, setCategories] = useState<Category[]>([])
  const [records, setRecords] = useState<Scope3Record[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadAll = useCallback(async () => {
    const [catRes, recRes, supRes] = await Promise.all([
      fetch('/api/scope-3/categories'),
      fetch('/api/scope-3'),
      fetch('/api/suppliers'),
    ])
    setCategories(await catRes.json() as Category[])
    setRecords(await recRes.json() as Scope3Record[])
    setSuppliers(await supRes.json() as Supplier[])
    setLoading(false)
  }, [])

  useEffect(() => { void loadAll() }, [loadAll])

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/scope-3', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        valueTco2e: Number(form.valueTco2e),
        confidence: Number(form.confidence),
        supplierId: form.supplierId || undefined,
      }),
    })
    setForm(emptyForm)
    setSaving(false)
    void loadAll()
  }

  const handleToggleMaterial = async (cat: Category) => {
    await fetch('/api/scope-3/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: cat.id, material: !cat.material }),
    })
    void loadAll()
  }

  const fmt = (v: number) => v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Scope 3 — Value Chain Emissions</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['records', 'categories'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            {t === 'records' ? '📋 Records' : '🗂 Categories'}
          </button>
        ))}
      </div>

      {tab === 'records' && (
        <>
          {/* Add record form */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Add Record</h2>
            <form onSubmit={handleAddRecord} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Category</label>
                <select
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                >
                  <option value="">Select category…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Supplier (optional)</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.supplierId}
                  onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                >
                  <option value="">None</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Period Year</label>
                <input
                  type="number"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.periodYear}
                  onChange={(e) => setForm({ ...form, periodYear: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Value (tCO₂e)</label>
                <input
                  type="number"
                  step="0.001"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.valueTco2e}
                  onChange={(e) => setForm({ ...form, valueTco2e: e.target.value })}
                  placeholder="100.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Calculation Method</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.calculationMethod}
                  onChange={(e) => setForm({ ...form, calculationMethod: e.target.value })}
                >
                  <option value="spend_based">Spend-based</option>
                  <option value="activity_based">Activity-based</option>
                  <option value="supplier_specific">Supplier-specific</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Data Source</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.dataSource}
                  onChange={(e) => setForm({ ...form, dataSource: e.target.value })}
                >
                  <option value="proxy">Proxy estimate</option>
                  <option value="supplier_form">Supplier form</option>
                  <option value="csv_import">CSV import</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Emission Factor Source</label>
                <input
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.emissionFactorSource}
                  onChange={(e) => setForm({ ...form, emissionFactorSource: e.target.value })}
                  placeholder="EXIOBASE 3.8"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Confidence (0–1)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.confidence}
                  onChange={(e) => setForm({ ...form, confidence: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Assumptions (optional)</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.assumptions}
                  onChange={(e) => setForm({ ...form, assumptions: e.target.value })}
                  placeholder="Spend-based proxy using sector average EF..."
                />
              </div>
              <div className="col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Add Record'}
                </button>
              </div>
            </form>
          </div>

          {/* Records table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Year</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Supplier</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">tCO₂e</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Source</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
                ) : records.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No records yet.</td></tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id} className="border-b border-gray-100">
                      <td className="px-4 py-3">{r.periodYear}</td>
                      <td className="px-4 py-3 text-gray-700">{r.category.code} — {r.category.name}</td>
                      <td className="px-4 py-3 text-gray-600">{r.supplier?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-green-700">{fmt(r.valueTco2e)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded ${r.dataSource === 'proxy' ? 'bg-yellow-100 text-yellow-700' : r.dataSource === 'supplier_form' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {r.dataSource}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-xs font-medium ${r.confidence < 0.6 ? 'text-red-600' : r.confidence < 0.9 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {(r.confidence * 100).toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'categories' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <p className="text-sm text-gray-500">Toggle materiality for each GHG Protocol Scope 3 category. Only material categories appear in the PDF export breakdown.</p>
          </div>
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Code</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Category</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Material</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100">
                    <td className="px-4 py-3 font-mono text-gray-500">{c.code}</td>
                    <td className="px-4 py-3 text-gray-700">{c.name}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => void handleToggleMaterial(c)}
                        className={`w-10 h-6 rounded-full transition-colors ${c.material ? 'bg-green-500' : 'bg-gray-300'}`}
                        title={c.material ? 'Click to mark as non-material' : 'Click to mark as material'}
                      >
                        <span className={`block w-4 h-4 rounded-full bg-white shadow mx-auto transform transition-transform ${c.material ? 'translate-x-2' : '-translate-x-2'}`} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
