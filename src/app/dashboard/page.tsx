"use client";

import { useEffect, useState } from "react";

interface DashboardData {
  companyName: string;
  reportingYear: number;
  scope1: number;
  scope2: number;
  scope3: number;
  total: number;
}

interface ApiError {
  error: string;
}

function KpiCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className={`rounded-xl p-6 shadow-sm border ${color}`}>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">
        {value.toLocaleString("en-DE", { maximumFractionDigits: 1 })}
      </p>
      <p className="mt-1 text-xs text-gray-400">tCO₂e</p>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | ApiError | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d: DashboardData | ApiError) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-gray-500 animate-pulse">Loading dashboard…</p>;
  }

  if (!data || "error" in data) {
    return (
      <div className="text-red-600">
        No company data found. Please seed the database.
      </div>
    );
  }

  // After the error guard above, data is guaranteed to be DashboardData
  const d = data as DashboardData;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
      <p className="text-gray-500 mb-8">
        {d.companyName} · Reporting Year {d.reportingYear}
      </p>

      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        <KpiCard
          label="Scope 1 — Direct"
          value={d.scope1}
          color="bg-white border-emerald-200"
        />
        <KpiCard
          label="Scope 2 — Energy Indirect"
          value={d.scope2}
          color="bg-white border-blue-200"
        />
        <KpiCard
          label="Scope 3 — Value Chain"
          value={d.scope3}
          color="bg-white border-amber-200"
        />
        <KpiCard
          label="Grand Total"
          value={d.total}
          color="bg-emerald-50 border-emerald-400"
        />
      </div>

      <div className="mt-10 p-6 bg-white rounded-xl border shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Emissions Breakdown
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-2">Scope</th>
              <th className="pb-2 text-right">tCO₂e</th>
              <th className="pb-2 text-right">Share</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {[
              { label: "Scope 1", value: d.scope1 },
              { label: "Scope 2", value: d.scope2 },
              { label: "Scope 3", value: d.scope3 },
            ].map(({ label, value }) => (
              <tr key={label}>
                <td className="py-2">{label}</td>
                <td className="py-2 text-right font-mono">
                  {value.toLocaleString("en-DE", { maximumFractionDigits: 1 })}
                </td>
                <td className="py-2 text-right text-gray-400">
                  {d.total > 0
                    ? ((value / d.total) * 100).toFixed(1) + "%"
                    : "—"}
                </td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td className="py-2">Total</td>
              <td className="py-2 text-right font-mono">
                {d.total.toLocaleString("en-DE", {
                  maximumFractionDigits: 1,
                })}
              </td>
              <td className="py-2 text-right">100%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
