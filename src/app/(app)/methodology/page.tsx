"use client";

import { useEffect, useState } from "react";

interface MethodologyNote {
  id: string;
  scope: string;
  text: string;
}

interface FormState {
  scope_1: string;
  scope_2: string;
  scope_3: string;
}

export default function MethodologyPage() {
  const [form, setForm] = useState<FormState>({
    scope_1: "",
    scope_2: "",
    scope_3: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/methodology");
      const notes = (await res.json()) as MethodologyNote[];
      const map: FormState = { scope_1: "", scope_2: "", scope_3: "" };
      for (const n of notes) {
        if (n.scope === "scope_1" || n.scope === "scope_2" || n.scope === "scope_3") {
          map[n.scope] = n.text;
        }
      }
      setForm(map);
      setLoading(false);
    };
    void load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const body = Object.entries(form).map(([scope, text]) => ({ scope, text }));
      const res = await fetch("/api/methodology", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-gray-500">Loading…</p>;

  const scopes: Array<{ key: keyof FormState; label: string }> = [
    { key: "scope_1", label: "Scope 1 — Direct Emissions" },
    { key: "scope_2", label: "Scope 2 — Indirect Energy" },
    { key: "scope_3", label: "Scope 3 — Value Chain" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Methodology Notes</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>
      )}

      <div className="space-y-6">
        {scopes.map(({ key, label }) => (
          <div key={key} className="bg-white rounded-xl border shadow-sm p-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {label}
            </label>
            <textarea
              rows={5}
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className="w-full border rounded px-3 py-2 text-sm text-gray-700 resize-y"
              placeholder={`Describe the methodology used for ${label.toLowerCase()}…`}
            />
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={() => void handleSave()}
          disabled={saving}
          className="bg-green-700 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-green-800 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Notes"}
        </button>
        {saved && (
          <span className="text-green-700 text-sm font-medium">✓ Saved!</span>
        )}
      </div>
    </div>
  );
}
