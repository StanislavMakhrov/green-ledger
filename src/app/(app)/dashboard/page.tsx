import { prisma } from "@/lib/db";
import { DEMO_COMPANY_ID, DEMO_REPORTING_YEAR } from "@/lib/constants";

interface KpiCardProps {
  label: string;
  value: number;
  unit?: string;
}

function KpiCard({ label, value, unit = "tCO₂e" }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl border border-green-100 shadow-sm p-6 flex flex-col gap-2">
      <span className="text-sm text-gray-500 font-medium">{label}</span>
      <span className="text-3xl font-bold text-green-800">
        {value.toFixed(2)}
      </span>
      <span className="text-xs text-gray-400">{unit}</span>
    </div>
  );
}

async function getDashboardTotals() {
  const [scope1Records, scope2Records, scope3Records] = await Promise.all([
    prisma.scope1Record.findMany({
      where: { companyId: DEMO_COMPANY_ID, periodYear: DEMO_REPORTING_YEAR },
      select: { valueTco2e: true },
    }),
    prisma.scope2Record.findMany({
      where: { companyId: DEMO_COMPANY_ID, periodYear: DEMO_REPORTING_YEAR },
      select: { valueTco2e: true },
    }),
    prisma.scope3Record.findMany({
      where: { companyId: DEMO_COMPANY_ID, periodYear: DEMO_REPORTING_YEAR },
      select: { valueTco2e: true },
    }),
  ]);

  const scope1 = scope1Records.reduce((s, r) => s + r.valueTco2e, 0);
  const scope2 = scope2Records.reduce((s, r) => s + r.valueTco2e, 0);
  const scope3 = scope3Records.reduce((s, r) => s + r.valueTco2e, 0);

  return { scope1, scope2, scope3, total: scope1 + scope2 + scope3 };
}

export default async function DashboardPage() {
  const { scope1, scope2, scope3, total } = await getDashboardTotals();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
      <p className="text-sm text-gray-500 mb-8">
        Reporting year: {DEMO_REPORTING_YEAR}
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Scope 1" value={scope1} />
        <KpiCard label="Scope 2" value={scope2} />
        <KpiCard label="Scope 3" value={scope3} />
        <KpiCard label="Total" value={total} />
      </div>
      <p className="mt-8 text-xs text-gray-400">
        All values in tonnes CO₂ equivalent (tCO₂e) for {DEMO_REPORTING_YEAR}.
      </p>
    </div>
  );
}
