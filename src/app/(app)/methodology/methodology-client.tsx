"use client";

import { useState } from "react";

interface MethodologyNote {
  id: string;
  scope: string;
  text: string;
}

interface MethodologyClientProps {
  initialNotes: MethodologyNote[];
}

const SCOPES = [
  { key: "scope_1", label: "Scope 1" },
  { key: "scope_2", label: "Scope 2" },
  { key: "scope_3", label: "Scope 3" },
];

export function MethodologyClient({ initialNotes }: MethodologyClientProps) {
  const getNote = (scope: string) =>
    initialNotes.find((n) => n.scope === scope)?.text ?? "";

  const [texts, setTexts] = useState<Record<string, string>>({
    scope_1: getNote("scope_1"),
    scope_2: getNote("scope_2"),
    scope_3: getNote("scope_3"),
  });
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  async function handleSave(scope: string) {
    setSaving(scope);
    try {
      const res = await fetch("/api/methodology", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, text: texts[scope] }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(scope);
      setTimeout(() => setSaved(null), 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error saving");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Methodology</h1>
      <p className="text-sm text-gray-500 mb-8">
        Document how emissions were calculated for each scope
      </p>
      <div className="space-y-6">
        {SCOPES.map(({ key, label }) => (
          <div
            key={key}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <h2 className="text-base font-semibold text-gray-800 mb-3">
              {label}
            </h2>
            <textarea
              rows={5}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-y"
              placeholder={`Describe the calculation methodology for ${label}…`}
              value={texts[key]}
              onChange={(e) =>
                setTexts((prev) => ({ ...prev, [key]: e.target.value }))
              }
            />
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => void handleSave(key)}
                disabled={saving === key}
                className="px-4 py-2 bg-green-700 text-white rounded-md text-sm font-medium hover:bg-green-800 disabled:opacity-50"
              >
                {saving === key ? "Saving…" : "Save"}
              </button>
              {saved === key && (
                <span className="text-sm text-green-600">✓ Saved</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
