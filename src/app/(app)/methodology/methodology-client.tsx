"use client";

import { useState } from "react";

interface MethodologyNote {
  scope: "scope_1" | "scope_2" | "scope_3";
  text: string;
}

interface ScopeSection {
  scope: "scope_1" | "scope_2" | "scope_3";
  label: string;
  placeholder: string;
}

const SECTIONS: ScopeSection[] = [
  {
    scope: "scope_1",
    label: "🔥 Scope 1 Methodology",
    placeholder:
      "Describe how direct emissions are calculated, including combustion methods, fuel types, and emission factors used…",
  },
  {
    scope: "scope_2",
    label: "⚡ Scope 2 Methodology",
    placeholder:
      "Describe how purchased energy emissions are calculated, whether market-based or location-based method is used…",
  },
  {
    scope: "scope_3",
    label: "🔗 Scope 3 Methodology",
    placeholder:
      "Describe the approach for value chain emissions, data collection from suppliers, proxy calculations, and category prioritisation…",
  },
];

export default function MethodologyClient({
  initialNotes,
}: {
  initialNotes: MethodologyNote[];
}) {
  const getInitialText = (scope: MethodologyNote["scope"]) =>
    initialNotes.find((n) => n.scope === scope)?.text ?? "";

  const [texts, setTexts] = useState<Record<string, string>>({
    scope_1: getInitialText("scope_1"),
    scope_2: getInitialText("scope_2"),
    scope_3: getInitialText("scope_3"),
  });
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSave(scope: string) {
    setSaving((s) => ({ ...s, [scope]: true }));
    setErrors((e) => ({ ...e, [scope]: "" }));
    try {
      const res = await fetch(`/api/methodology/${scope}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: texts[scope] }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error);
      }
      setSaved((s) => ({ ...s, [scope]: true }));
      setTimeout(() => setSaved((s) => ({ ...s, [scope]: false })), 2500);
    } catch (err) {
      setErrors((e) => ({
        ...e,
        [scope]: err instanceof Error ? err.message : "Save failed",
      }));
    } finally {
      setSaving((s) => ({ ...s, [scope]: false }));
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Methodology</h1>
        <p className="text-gray-500 mt-1">
          Document calculation methodology and emission factor sources for each scope
        </p>
      </div>

      <div className="space-y-6">
        {SECTIONS.map(({ scope, label, placeholder }) => (
          <div
            key={scope}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-800">{label}</h2>
              <div className="flex items-center gap-3">
                {saved[scope] && (
                  <span className="text-sm text-green-600 font-medium">✓ Saved</span>
                )}
                {errors[scope] && (
                  <span className="text-sm text-red-600">{errors[scope]}</span>
                )}
                <button
                  onClick={() => void handleSave(scope)}
                  disabled={saving[scope]}
                  className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {saving[scope] ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
            <textarea
              value={texts[scope]}
              onChange={(e) =>
                setTexts((t) => ({ ...t, [scope]: e.target.value }))
              }
              placeholder={placeholder}
              rows={8}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 resize-vertical"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
