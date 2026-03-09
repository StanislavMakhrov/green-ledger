"use client";
import { useEffect, useState } from "react";
interface Rec { id: string; periodYear: number; valueTco2e: number; calculationMethod: string; emissionFactorsSource: string; dataSource: string; }
const emptyForm = { periodYear: new Date().getFullYear(), valueTco2e: "", calculationMethod: "", emissionFactorsSource: "", dataSource: "manual", assumptions: "" };
export default function Scope2Page() {
  const [records, setRecords] = useState<Rec[]>([]);
  const [form, setForm] = useState(emptyForm);
  useEffect(() => {
    async function load() { const r = await fetch("/api/scope-2"); setRecords(await r.json()); }
    void load();
  }, []);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/scope-2", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, valueTco2e: Number(form.valueTco2e), periodYear: Number(form.periodYear) }) });
    setForm(emptyForm);
    const r = await fetch("/api/scope-2");
    setRecords(await r.json());
  }
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Scope 2 — Indirect Emissions (Location-Based)</h1>
      <form onSubmit={handleSubmit} className="mb-8 bg-white p-4 rounded shadow space-y-3">
        <h2 className="font-semibold text-gray-700">Add Record</h2>
        <div className="grid grid-cols-2 gap-3">
          <input className="border rounded px-3 py-2 text-sm" type="number" placeholder="Year" value={form.periodYear} onChange={e => setForm({...form, periodYear: Number(e.target.value)})} required />
          <input className="border rounded px-3 py-2 text-sm" type="number" step="0.001" placeholder="tCO₂e" value={form.valueTco2e} onChange={e => setForm({...form, valueTco2e: e.target.value})} required />
          <input className="border rounded px-3 py-2 text-sm" placeholder="Calculation Method" value={form.calculationMethod} onChange={e => setForm({...form, calculationMethod: e.target.value})} required />
          <input className="border rounded px-3 py-2 text-sm" placeholder="Emission Factors Source" value={form.emissionFactorsSource} onChange={e => setForm({...form, emissionFactorsSource: e.target.value})} required />
          <select className="border rounded px-3 py-2 text-sm" value={form.dataSource} onChange={e => setForm({...form, dataSource: e.target.value})}>
            <option value="manual">Manual</option><option value="csv_import">CSV Import</option>
          </select>
          <input className="border rounded px-3 py-2 text-sm" placeholder="Assumptions (optional)" value={form.assumptions} onChange={e => setForm({...form, assumptions: e.target.value})} />
        </div>
        <button className="bg-green-700 text-white px-4 py-2 rounded text-sm hover:bg-green-800">Add Record</button>
      </form>
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full text-sm"><thead className="bg-gray-50 text-gray-600"><tr><th className="px-4 py-3 text-left">Year</th><th className="px-4 py-3 text-left">tCO₂e</th><th className="px-4 py-3 text-left">Method</th><th className="px-4 py-3 text-left">Source</th></tr></thead>
        <tbody>{records.map(r => <tr key={r.id} className="border-t"><td className="px-4 py-3">{r.periodYear}</td><td className="px-4 py-3 font-mono">{r.valueTco2e.toFixed(3)}</td><td className="px-4 py-3">{r.calculationMethod}</td><td className="px-4 py-3">{r.emissionFactorsSource}</td></tr>)}</tbody></table>
        {records.length === 0 && <p className="px-4 py-6 text-gray-400 text-sm">No records yet.</p>}
      </div>
    </div>
  );
}
