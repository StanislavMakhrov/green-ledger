"use client";
import { useEffect, useState } from "react";

interface DashboardData {
  scope1: number;
  scope2: number;
  scope3: number;
  total: number;
  reportingYear: number;
  companyName: string;
}

function KpiCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-lg p-6 text-white ${color}`}>
      <p className="text-sm opacity-80">{label}</p>
      <p className="text-3xl font-bold mt-1">{value.toFixed(2)}</p>
      <p className="text-xs opacity-60 mt-1">tCO₂e</p>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/dashboard");
      if (!res.ok) { setError("Failed to load dashboard"); return; }
      setData(await res.json());
    }
    void load();
  }, []);

  if (error) return <p className="text-red-500">{error}</p>;
  if (!data) return <p className="text-gray-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">{data.companyName}</h1>
      <p className="text-gray-500 mb-6">Reporting Year: {data.reportingYear}</p>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Scope 1" value={data.scope1} color="bg-blue-600" />
        <KpiCard label="Scope 2" value={data.scope2} color="bg-indigo-600" />
        <KpiCard label="Scope 3" value={data.scope3} color="bg-purple-600" />
        <KpiCard label="Total" value={data.total} color="bg-green-700" />
      </div>
    </div>
  );
}
