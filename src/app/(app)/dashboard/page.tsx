"use client";

import { useEffect, useState } from "react";

interface DashboardData {
  scope1Total: number;
  scope2Total: number;
  scope3Total: number;
  total: number;
  reportingYear: number;
}

function KpiCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) {
  return (
    <div className={`rounded-xl border p-6 shadow-sm bg-white`}>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className={`mt-2 text-3xl font-bold ${color}`}>
        {value.toFixed(2)}
      </p>
      <p className="mt-1 text-xs text-gray-400">tCO₂e</p>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("Failed to load dashboard");
        const json = (await res.json()) as DashboardData;
        setData(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      }
    };
    void load();
  }, []);

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-red-700">{error}</div>
    );
  }

  if (!data) {
    return <p className="text-gray-500">Loading…</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Dashboard</h1>
      <p className="text-sm text-gray-500 mb-8">
        Reporting Year: <strong>{data.reportingYear}</strong>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Scope 1 — Direct"
          value={data.scope1Total}
          color="text-blue-600"
        />
        <KpiCard
          title="Scope 2 — Energy"
          value={data.scope2Total}
          color="text-purple-600"
        />
        <KpiCard
          title="Scope 3 — Value Chain"
          value={data.scope3Total}
          color="text-orange-600"
        />
        <KpiCard
          title="Total Emissions"
          value={data.total}
          color="text-green-700"
        />
      </div>
    </div>
  );
}
