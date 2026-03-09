"use client";

import { useState, useCallback } from "react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";

interface Scope3Category {
  id: string;
  code: string;
  name: string;
  material: boolean;
  materialityReason: string | null;
}

interface CategoryListProps {
  initialCategories: Scope3Category[];
}

export default function CategoryList({ initialCategories }: CategoryListProps) {
  const [categories, setCategories] = useState<Scope3Category[]>(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reasonText, setReasonText] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const res = await fetch("/api/scope3/categories");
    const data = await res.json();
    setCategories(data);
  }, []);

  async function toggleMaterial(cat: Scope3Category) {
    setSaving(cat.id);
    try {
      await fetch(`/api/scope3/categories/${cat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ material: !cat.material }),
      });
      await reload();
    } finally {
      setSaving(null);
    }
  }

  async function saveReason(cat: Scope3Category) {
    setSaving(cat.id);
    try {
      await fetch(`/api/scope3/categories/${cat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialityReason: reasonText }),
      });
      setEditingId(null);
      await reload();
    } finally {
      setSaving(null);
    }
  }

  function startEdit(cat: Scope3Category) {
    setEditingId(cat.id);
    setReasonText(cat.materialityReason ?? "");
  }

  return (
    <div className="space-y-2">
      {categories.map((cat) => (
        <div
          key={cat.id}
          className={`border rounded-lg p-4 transition-colors ${cat.material ? "border-green-200 bg-green-50" : "border-gray-200 bg-white"}`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Badge variant={cat.material ? "green" : "gray"}>
                {cat.code}
              </Badge>
              <span className="text-sm font-medium text-gray-800">
                {cat.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {cat.material && (
                <Badge variant="green">Material</Badge>
              )}
              <Button
                size="sm"
                variant={cat.material ? "danger" : "secondary"}
                onClick={() => toggleMaterial(cat)}
                disabled={saving === cat.id}
              >
                {saving === cat.id
                  ? "..."
                  : cat.material
                    ? "Mark Non-material"
                    : "Mark Material"}
              </Button>
              {cat.material && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => startEdit(cat)}
                >
                  {cat.materialityReason ? "Edit Reason" : "Add Reason"}
                </Button>
              )}
            </div>
          </div>

          {cat.materialityReason && editingId !== cat.id && (
            <p className="mt-2 text-xs text-gray-600 pl-16">
              <span className="font-medium">Reason:</span>{" "}
              {cat.materialityReason}
            </p>
          )}

          {editingId === cat.id && (
            <div className="mt-3 flex gap-2 items-end pl-16">
              <Input
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                placeholder="Why is this category material?"
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={() => saveReason(cat)}
                disabled={saving === cat.id}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setEditingId(null)}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
