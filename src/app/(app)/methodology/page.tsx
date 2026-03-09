"use client";
import { useEffect, useState } from "react";

interface MethodologyNote {
  id: string;
  scope: string;
  text: string;
}

const SCOPES = [
  { key: "scope_1", label: "Scope 1 — Direct Emissions" },
  { key: "scope_2", label: "Scope 2 — Indirect Emissions (Location-Based)" },
  { key: "scope_3", label: "Scope 3 — Value Chain Emissions" },
];

export default function MethodologyPage() {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/methodology");
      const data: MethodologyNote[] = await res.json();
      const noteMap: Record<string, string> = {};
      data.forEach((n) => { noteMap[n.scope] = n.text; });
      setNotes(noteMap);
    }
    void load();
  }, []);

  async function handleSave(scope: string) {
    await fetch("/api/methodology", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope, text: notes[scope] ?? "" }),
    });
    setSaved((prev) => ({ ...prev, [scope]: true }));
    setTimeout(() => setSaved((prev) => ({ ...prev, [scope]: false })), 2000);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Methodology Notes</h1>
      <p className="text-gray-500 mb-6 text-sm">Document the methodology used for each scope. These notes appear in the CSRD Climate Report PDF.</p>

      <div className="space-y-6">
        {SCOPES.map(({ key, label }) => (
          <div key={key} className="bg-white rounded shadow p-4">
            <h2 className="font-semibold text-gray-700 mb-2">{label}</h2>
            <textarea
              className="w-full border rounded px-3 py-2 text-sm h-32 resize-y"
              value={notes[key] ?? ""}
              onChange={(e) => setNotes((prev) => ({ ...prev, [key]: e.target.value }))}
              placeholder={`Describe the ${key.replace("_", " ")} calculation methodology…`}
            />
            <button
              type="button"
              onClick={() => void handleSave(key)}
              className="mt-2 bg-green-700 text-white px-4 py-2 rounded text-sm hover:bg-green-800"
            >
              {saved[key] ? "Saved ✓" : "Save"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
