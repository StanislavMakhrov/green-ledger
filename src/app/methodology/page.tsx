"use client";

import { useEffect, useState } from "react";

interface MethodologyNote {
  id: string;
  scope: string;
  text: string;
}

const SCOPES = [
  { key: "scope_1", label: "Scope 1 — Direct Emissions" },
  { key: "scope_2", label: "Scope 2 — Energy Indirect" },
  { key: "scope_3", label: "Scope 3 — Value Chain" },
];

export default function MethodologyPage() {
  const [notes, setNotes] = useState<Record<string, string>>({
    scope_1: "",
    scope_2: "",
    scope_3: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/methodology")
      .then((r) => r.json())
      .then((data: MethodologyNote[]) => {
        if (Array.isArray(data)) {
          const map: Record<string, string> = {};
          for (const n of data) {
            map[n.scope] = n.text;
          }
          setNotes((prev) => ({ ...prev, ...map }));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async (scope: string) => {
    setSaving(scope);
    await fetch("/api/methodology", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope, text: notes[scope] }),
    });
    setSaving(null);
    setSaved(scope);
    setTimeout(() => setSaved(null), 2000);
  };

  if (loading) {
    return <p className="text-gray-400 animate-pulse">Loading…</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Methodology</h1>
      <p className="text-gray-500 mb-8 text-sm">
        Document the methodologies used to calculate GHG emissions for each scope.
        These notes will appear in the exported CSRD report.
      </p>

      <div className="flex flex-col gap-6">
        {SCOPES.map(({ key, label }) => (
          <div key={key} className="bg-white rounded-xl border p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-800 mb-3">{label}</h2>
            <textarea
              className="w-full border rounded-lg p-3 text-sm text-gray-700 resize-y min-h-[120px] focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder={`Describe the calculation methodology for ${label}…`}
              value={notes[key] ?? ""}
              onChange={(e) =>
                setNotes((prev) => ({ ...prev, [key]: e.target.value }))
              }
            />
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={() => save(key)}
                disabled={saving === key}
                className="bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-emerald-800 disabled:opacity-50"
              >
                {saving === key ? "Saving…" : "Save"}
              </button>
              {saved === key && (
                <span className="text-sm text-emerald-600 font-medium">Saved ✓</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
