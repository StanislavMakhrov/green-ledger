import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import { formatTco2e } from "@/lib/utils";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";

export const dynamic = "force-dynamic";

interface KpiCardProps {
  title: string;
  value: string;
  unit: string;
  icon: string;
  color: string;
}

function KpiCard({ title, value, unit, icon, color }: KpiCardProps) {
  return (
    <Card className={`border-l-4 ${color}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500 mt-1">{unit}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </Card>
  );
}

async function getDashboardData() {
  const company = await prisma.company.findUnique({
    where: { id: DEMO_COMPANY_ID },
  });

  if (!company) {
    return { scope1: 0, scope2: 0, scope3: 0, total: 0, reportingYear: 2024 };
  }

  const year = company.reportingYear;

  const [scope1Agg, scope2Agg, scope3Agg] = await Promise.all([
    prisma.scope1Record.aggregate({
      where: { companyId: DEMO_COMPANY_ID, periodYear: year },
      _sum: { valueTco2e: true },
    }),
    prisma.scope2Record.aggregate({
      where: { companyId: DEMO_COMPANY_ID, periodYear: year },
      _sum: { valueTco2e: true },
    }),
    prisma.scope3Record.aggregate({
      where: { companyId: DEMO_COMPANY_ID, periodYear: year },
      _sum: { valueTco2e: true },
    }),
  ]);

  const scope1 = scope1Agg._sum.valueTco2e ?? 0;
  const scope2 = scope2Agg._sum.valueTco2e ?? 0;
  const scope3 = scope3Agg._sum.valueTco2e ?? 0;
  const total = scope1 + scope2 + scope3;

  return { scope1, scope2, scope3, total, reportingYear: year };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Emissions overview for reporting year ${data.reportingYear}`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Scope 1"
          value={formatTco2e(data.scope1)}
          unit="tCO₂e — Direct emissions"
          icon="🔥"
          color="border-orange-400"
        />
        <KpiCard
          title="Scope 2"
          value={formatTco2e(data.scope2)}
          unit="tCO₂e — Indirect (energy)"
          icon="⚡"
          color="border-yellow-400"
        />
        <KpiCard
          title="Scope 3"
          value={formatTco2e(data.scope3)}
          unit="tCO₂e — Value chain"
          icon="🌍"
          color="border-blue-400"
        />
        <KpiCard
          title="Total"
          value={formatTco2e(data.total)}
          unit="tCO₂e — Combined"
          icon="📊"
          color="border-green-500"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Reporting Year</h3>
          <p className="text-2xl font-bold text-gray-900">{data.reportingYear}</p>
        </Card>
        <Card>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Standard</h3>
          <p className="text-lg font-semibold text-gray-900">CSRD / ESRS E1</p>
          <p className="text-sm text-gray-500">GHG Protocol aligned</p>
        </Card>
        <Card>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Company</h3>
          <p className="text-lg font-semibold text-gray-900">Demo GmbH</p>
          <p className="text-sm text-gray-500">Operational control boundary</p>
        </Card>
      </div>
    </div>
  );
}
