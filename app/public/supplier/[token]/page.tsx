/**
 * Public supplier form page.
 *
 * This page is accessible without authentication via a tokenized URL:
 * /public/supplier/[token]
 *
 * Suppliers submit their emissions activity data (spend, transport, or waste).
 * The system auto-calculates tCO₂e and creates a Scope3Record.
 *
 * Client component: uses useState for the form and API call.
 *
 * Related spec: docs/spec.md §"Supplier Public Form", §"Proxy & Assumptions"
 */
'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'

type ActivityType = 'spend_eur' | 'ton_km' | 'waste_kg'

interface FormState {
  activityType: ActivityType
  value: string
  notes: string
}

export default function SupplierFormPage() {
  const params = useParams()
  const token = params?.token as string

  const [form, setForm] = useState<FormState>({
    activityType: 'spend_eur',
    value: '',
    notes: '',
  })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [result, setResult] = useState<{ valueTco2e: number } | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const ACTIVITY_OPTIONS: { value: ActivityType; label: string; placeholder: string; description: string }[] = [
    {
      value: 'spend_eur',
      label: 'Annual Spend (EUR)',
      placeholder: '50000',
      description: 'Total EUR you charged us for goods/services in the reporting year',
    },
    {
      value: 'ton_km',
      label: 'Transport Activity (tonne-km)',
      placeholder: '12000',
      description: 'Total freight transported for us in tonne-kilometres',
    },
    {
      value: 'waste_kg',
      label: 'Waste Generated (kg)',
      placeholder: '800',
      description: 'Total waste generated from your operations serving us (kg)',
    },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')

    const payload: Record<string, number | string> = {
      notes: form.notes,
      [form.activityType]: Number(form.value),
    }

    try {
      const res = await fetch(`/api/public/supplier/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json() as { error: string }
        throw new Error(err.error ?? 'Submission failed')
      }

      const data = await res.json() as { valueTco2e: number }
      setResult(data)
      setStatus('success')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred')
      setStatus('error')
    }
  }

  if (status === 'success' && result) {
    return (
      <div className="text-center py-10">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank you!</h1>
        <p className="text-gray-600 mb-4">Your emissions data has been submitted successfully.</p>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 inline-block">
          <p className="text-sm text-gray-600">Calculated CO₂ equivalent:</p>
          <p className="text-3xl font-bold text-green-700 mt-1">
            {result.valueTco2e.toLocaleString('de-DE', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
          </p>
          <p className="text-xs text-gray-500">tCO₂e (tonnes of CO₂ equivalent)</p>
        </div>
        <p className="text-xs text-gray-400 mt-6">
          This value was automatically calculated using spend/activity-based proxy emission factors.
          Your customer will review this data as part of their CSRD reporting.
        </p>
      </div>
    )
  }

  const selectedOption = ACTIVITY_OPTIONS.find((o) => o.value === form.activityType)!

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Emissions Data Submission</h1>
      <p className="text-gray-600 mb-6 text-sm">
        Your customer is collecting emissions data from their supply chain for CSRD/ESRS E1 climate
        reporting. Please provide your best available data below.
      </p>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Activity type selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What type of data can you provide?
            </label>
            <div className="grid gap-2">
              {ACTIVITY_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    form.activityType === opt.value
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="activityType"
                    value={opt.value}
                    checked={form.activityType === opt.value}
                    onChange={() => setForm({ ...form, activityType: opt.value })}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-700">{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Value input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {selectedOption.label}
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              placeholder={selectedOption.placeholder}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional notes (optional)
            </label>
            <textarea
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any context, assumptions, or data quality notes…"
            />
          </div>

          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full bg-green-600 text-white px-5 py-3 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {status === 'submitting' ? 'Submitting…' : 'Submit Data'}
          </button>
        </form>
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center">
        Your data will be used solely for GHG reporting purposes in accordance with the GHG Protocol.
        Emission factors are placeholders for demonstration.
      </p>
    </div>
  )
}
