"use client";

import { useEffect, useState } from "react";

interface MethodologyNote {
  id: string;
  scope: string;
  text: string;
  updatedAt: string;
}

const SCOPES = [
  { key: "scope_1", label: "Scope 1 — Direct Emissions" },
  { key: "scope_2", label: "Scope 2 — Energy Indirect" },
  { key: "scope_3", label: "Scope 3 — Value Chain" },
];

export default function MethodologyPage() {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/methodology")
      .then((r) => r.json())
      .then((data: MethodologyNote[]) => {
        const map: Record<string, string> = {};
        for (const n of data) map[n.scope] = n.text;
        setNotes(map);
      });
  }, []);

  const handleSave = async (scope: string) => {
    await fetch("/api/methodology", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope, text: notes[scope] ?? "" }),
    });
    setSaved({ ...saved, [scope]: true });
    setTimeout(() => setSaved((s) => ({ ...s, [scope]: false })), 2000);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Methodology Notes</h2>
      <p className="text-sm text-gray-500 mb-6">
        Document the calculation methods and emission factor sources for each scope.
      </p>

      <div className="space-y-6">
        {SCOPES.map(({ key, label }) => (
          <div key={key} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">{label}</h3>
            <textarea
              className="border rounded w-full px-3 py-2 text-sm"
              rows={5}
              value={notes[key] ?? ""}
              onChange={(e) => setNotes({ ...notes, [key]: e.target.value })}
              placeholder={`Describe the ${label} calculation methodology…`}
            />
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => { void handleSave(key); }}
                className="bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 text-sm"
              >
                Save
              </button>
              {saved[key] && <span className="text-green-600 text-sm">✅ Saved!</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
