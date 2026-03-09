"use client";

import { useEffect, useState } from "react";

interface DashboardData {
  scope1: number;
  scope2: number;
  scope3: number;
  total: number;
  year: number;
  company: { name: string; reportingYear: number } | null;
}

function KpiCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${color}`}>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-800">{value.toFixed(2)}</p>
      <p className="text-xs text-gray-400 mt-1">tCO₂e</p>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500">Loading…</div>;
  if (!data) return <div className="text-red-500">Failed to load dashboard data.</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Dashboard</h2>
      <p className="text-gray-500 mb-6">
        {data.company?.name ?? "Company"} · Reporting Year {data.year}
      </p>
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        <KpiCard label="Scope 1 (Direct)" value={data.scope1} color="border-red-400" />
        <KpiCard label="Scope 2 (Energy)" value={data.scope2} color="border-yellow-400" />
        <KpiCard label="Scope 3 (Value Chain)" value={data.scope3} color="border-blue-400" />
        <KpiCard label="Grand Total" value={data.total} color="border-green-500" />
      </div>
    </div>
  );
}
