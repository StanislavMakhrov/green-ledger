"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Textarea from "@/components/ui/Textarea";
import Card from "@/components/ui/Card";

interface MethodologyNote {
  id: string;
  scope: string;
  text: string;
  updatedAt: string | Date;
}

interface MethodologyEditorProps {
  initialNotes: MethodologyNote[];
}

const SCOPE_LABELS: Record<string, { label: string; description: string }> = {
  scope_1: {
    label: "Scope 1 — Direct Emissions",
    description:
      "Describe the methodology used to measure and calculate direct emissions from owned facilities and vehicles.",
  },
  scope_2: {
    label: "Scope 2 — Indirect Energy Emissions",
    description:
      "Describe the location-based or market-based methodology used for purchased energy emissions.",
  },
  scope_3: {
    label: "Scope 3 — Value Chain Emissions",
    description:
      "Describe how supply chain emissions were calculated, which proxy factors were used, and data quality limitations.",
  },
};

const SCOPES = ["scope_1", "scope_2", "scope_3"];

export default function MethodologyEditor({
  initialNotes,
}: MethodologyEditorProps) {
  const [notes, setNotes] = useState<Record<string, string>>(
    Object.fromEntries(
      initialNotes.map((n) => [n.scope, n.text])
    )
  );
  const [updatedAt, setUpdatedAt] = useState<Record<string, string>>(
    Object.fromEntries(
      initialNotes.map((n) => [n.scope, new Date(n.updatedAt).toISOString()])
    )
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<Record<string, string>>({});

  async function handleSave(scope: string) {
    setSaving(scope);
    setError((prev) => ({ ...prev, [scope]: "" }));

    try {
      const res = await fetch(`/api/methodology/${scope}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: notes[scope] ?? "" }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError((prev) => ({ ...prev, [scope]: data.error || "Failed to save" }));
        return;
      }

      const data = await res.json();
      setUpdatedAt((prev) => ({ ...prev, [scope]: data.updatedAt }));
      setSaved(scope);
      setTimeout(() => setSaved(null), 2000);
    } catch {
      setError((prev) => ({ ...prev, [scope]: "Network error" }));
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-6">
      {SCOPES.map((scope) => {
        const meta = SCOPE_LABELS[scope];
        return (
          <Card key={scope}>
            <div className="mb-3">
              <h3 className="font-semibold text-gray-900">{meta.label}</h3>
              <p className="text-sm text-gray-500 mt-1">{meta.description}</p>
            </div>

            <Textarea
              value={notes[scope] ?? ""}
              onChange={(e) =>
                setNotes((prev) => ({ ...prev, [scope]: e.target.value }))
              }
              rows={6}
              placeholder="Enter methodology notes for this scope..."
            />

            {error[scope] && (
              <p className="mt-2 text-sm text-red-600">{error[scope]}</p>
            )}

            <div className="mt-3 flex items-center gap-4">
              <Button
                onClick={() => handleSave(scope)}
                disabled={saving === scope}
              >
                {saving === scope
                  ? "Saving..."
                  : saved === scope
                    ? "✓ Saved!"
                    : "Save"}
              </Button>
              {updatedAt[scope] && (
                <p className="text-xs text-gray-400">
                  Last updated:{" "}
                  {new Date(updatedAt[scope]).toLocaleString("de-DE")}
                </p>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
