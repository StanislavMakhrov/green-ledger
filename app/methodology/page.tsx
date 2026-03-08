/**
 * Methodology page — edit MethodologyNote per scope.
 *
 * Client component: uses useState/useEffect for data loading and saving.
 *
 * Related spec: docs/spec.md §"MethodologyNote"
 */
'use client'

import { useState, useEffect, useCallback } from 'react'

interface MethodologyNote {
  id: string
  scope: string
  text: string
  updatedAt: string
}

const SCOPES = [
  { value: 'scope_1', label: 'Scope 1 — Direct Emissions', description: 'Describe the methodology used for direct emission calculations.' },
  { value: 'scope_2', label: 'Scope 2 — Purchased Energy', description: 'Describe the location-based or market-based method used.' },
  { value: 'scope_3', label: 'Scope 3 — Value Chain', description: 'Describe the spend-based proxies, activity-based methods, and supplier data quality.' },
]

export default function MethodologyPage() {
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  const loadNotes = useCallback(async () => {
    const res = await fetch('/api/methodology')
    const data = await res.json() as MethodologyNote[]
    const map: Record<string, string> = {}
    for (const note of data) {
      map[note.scope] = note.text
    }
    setNotes(map)
    setLoading(false)
  }, [])

  useEffect(() => { void loadNotes() }, [loadNotes])

  const handleSave = async (scope: string) => {
    setSaving(scope)
    await fetch('/api/methodology', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope, text: notes[scope] ?? '' }),
    })
    setSaving(null)
    setSaved(scope)
    setTimeout(() => setSaved(null), 2000)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Methodology Notes</h1>
      <p className="text-gray-500 mb-6 text-sm">
        Document the calculation methodologies for each scope. These notes appear in the CSRD Climate Report PDF.
      </p>

      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : (
        <div className="space-y-6">
          {SCOPES.map((scope) => (
            <div key={scope.value} className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-1">{scope.label}</h2>
              <p className="text-sm text-gray-400 mb-3">{scope.description}</p>
              <textarea
                rows={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-y"
                value={notes[scope.value] ?? ''}
                onChange={(e) => setNotes({ ...notes, [scope.value]: e.target.value })}
                placeholder="Enter methodology description…"
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={() => void handleSave(scope.value)}
                  disabled={saving === scope.value}
                  className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {saving === scope.value ? 'Saving…' : saved === scope.value ? '✓ Saved' : 'Save'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
