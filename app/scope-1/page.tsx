/**
 * Scope 1 page — add and list direct emission records.
 *
 * Client component: uses useState/useEffect for form and API calls.
 *
 * Related spec: docs/spec.md §"Scope1Record"
 */
'use client'

import { useState, useEffect, useCallback } from 'react'

interface Scope1Record {
  id: string
  periodYear: number
  valueTco2e: number
  calculationMethod: string
  emissionFactorsSource: string
  dataSource: string
  assumptions: string | null
  createdAt: string
}

const emptyForm = {
  periodYear: 2024,
  valueTco2e: '',
  calculationMethod: '',
  emissionFactorsSource: '',
  dataSource: 'manual',
  assumptions: '',
}

export default function Scope1Page() {
  const [records, setRecords] = useState<Scope1Record[]>([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadRecords = useCallback(async () => {
    const res = await fetch('/api/scope-1')
    const data = await res.json() as Scope1Record[]
    setRecords(data)
    setLoading(false)
  }, [])

  useEffect(() => { void loadRecords() }, [loadRecords])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/scope-1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, valueTco2e: Number(form.valueTco2e) }),
    })
    setForm(emptyForm)
    setSaving(false)
    void loadRecords()
  }

  const fmt = (v: number) => v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Scope 1 — Direct Emissions</h1>
      <p className="text-gray-500 mb-6 text-sm">Emissions from owned or controlled combustion sources (gas, diesel, etc.).</p>

      {/* Add form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Add Record</h2>
        <form onSubmit={handleAdd} className="grid grid-cols-2 gap-4">
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
              placeholder="45.2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Calculation Method</label>
            <input
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              value={form.calculationMethod}
              onChange={(e) => setForm({ ...form, calculationMethod: e.target.value })}
              placeholder="Direct measurement (gas meter)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Emission Factors Source</label>
            <input
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              value={form.emissionFactorsSource}
              onChange={(e) => setForm({ ...form, emissionFactorsSource: e.target.value })}
              placeholder="DEFRA 2024"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Data Source</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              value={form.dataSource}
              onChange={(e) => setForm({ ...form, dataSource: e.target.value })}
            >
              <option value="manual">Manual Entry</option>
              <option value="csv_import">CSV Import</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Assumptions (optional)</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              value={form.assumptions}
              onChange={(e) => setForm({ ...form, assumptions: e.target.value })}
              placeholder="Natural gas for heating..."
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
              <th className="text-right px-4 py-3 font-medium text-gray-500">tCO₂e</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Method</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">EF Source</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Source</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No records yet.</td></tr>
            ) : (
              records.map((r) => (
                <tr key={r.id} className="border-b border-gray-100">
                  <td className="px-4 py-3">{r.periodYear}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-orange-700">{fmt(r.valueTco2e)}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{r.calculationMethod}</td>
                  <td className="px-4 py-3 text-gray-600">{r.emissionFactorsSource}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{r.dataSource}</span>
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
