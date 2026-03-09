"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

interface Supplier {
  id: string;
  name: string;
  country: string;
  sector: string;
  contactEmail: string;
  publicFormToken: string;
  status: string;
}

interface SupplierFormProps {
  supplier?: Supplier;
  onSuccess: () => void;
  onCancel: () => void;
}

const SECTORS = [
  { value: "Logistics", label: "Logistics" },
  { value: "Manufacturing", label: "Manufacturing" },
  { value: "Energy", label: "Energy" },
  { value: "Technology", label: "Technology" },
  { value: "Construction", label: "Construction" },
  { value: "Agriculture", label: "Agriculture" },
  { value: "Retail", label: "Retail" },
  { value: "Services", label: "Services" },
  { value: "Other", label: "Other" },
];

const COUNTRIES = [
  { value: "DE", label: "Germany" },
  { value: "AT", label: "Austria" },
  { value: "CH", label: "Switzerland" },
  { value: "FR", label: "France" },
  { value: "NL", label: "Netherlands" },
  { value: "PL", label: "Poland" },
  { value: "CZ", label: "Czech Republic" },
  { value: "IT", label: "Italy" },
  { value: "ES", label: "Spain" },
  { value: "OTHER", label: "Other" },
];

export default function SupplierForm({
  supplier,
  onSuccess,
  onCancel,
}: SupplierFormProps) {
  const [name, setName] = useState(supplier?.name ?? "");
  const [country, setCountry] = useState(supplier?.country ?? "DE");
  const [sector, setSector] = useState(supplier?.sector ?? "");
  const [contactEmail, setContactEmail] = useState(supplier?.contactEmail ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!supplier;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const url = isEdit ? `/api/suppliers/${supplier.id}` : "/api/suppliers";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, country, sector, contactEmail }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save supplier");
        return;
      }

      onSuccess();
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="name"
        label="Company Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        placeholder="e.g. Acme Logistics GmbH"
      />
      <Select
        id="country"
        label="Country"
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        options={COUNTRIES}
      />
      <Select
        id="sector"
        label="Sector"
        value={sector}
        onChange={(e) => setSector(e.target.value)}
        options={SECTORS}
        placeholder="Select sector..."
        required
      />
      <Input
        id="contactEmail"
        label="Contact Email"
        type="email"
        value={contactEmail}
        onChange={(e) => setContactEmail(e.target.value)}
        required
        placeholder="contact@example.com"
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : isEdit ? "Update Supplier" : "Add Supplier"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
