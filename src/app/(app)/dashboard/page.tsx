import { prisma } from "@/lib/prisma";
import { DEMO_COMPANY_ID } from "@/lib/constants";

// Force dynamic rendering — page requires database access at request time
export const dynamic = "force-dynamic";

/**
 * Dashboard page - server component that fetches KPI aggregates directly
 * from Prisma and renders summary cards for each emission scope.
 */
export default async function DashboardPage() {
  const company = await prisma.company.findUnique({
    where: { id: DEMO_COMPANY_ID },
  });

  const year = company?.reportingYear ?? new Date().getFullYear();
  const where = { companyId: DEMO_COMPANY_ID, periodYear: year };

  const [scope1Agg, scope2Agg, scope3Agg] = await Promise.all([
    prisma.scope1Record.aggregate({ _sum: { valueTco2e: true }, where }),
    prisma.scope2Record.aggregate({ _sum: { valueTco2e: true }, where }),
    prisma.scope3Record.aggregate({ _sum: { valueTco2e: true }, where }),
  ]);

  const scope1 = scope1Agg._sum.valueTco2e ?? 0;
  const scope2 = scope2Agg._sum.valueTco2e ?? 0;
  const scope3 = scope3Agg._sum.valueTco2e ?? 0;
  const total = scope1 + scope2 + scope3;

  const cards = [
    { label: "🔥 Scope 1", subtitle: "Direct emissions", value: scope1, color: "border-orange-400" },
    { label: "⚡ Scope 2", subtitle: "Purchased energy", value: scope2, color: "border-yellow-400" },
    { label: "🔗 Scope 3", subtitle: "Value chain", value: scope3, color: "border-blue-400" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          {company?.name ?? "Demo GmbH"} · Reporting Year {year}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`bg-white rounded-xl shadow-sm border-l-4 ${card.color} p-6`}
          >
            <p className="text-sm font-medium text-gray-500">{card.label}</p>
            <p className="text-xs text-gray-400 mb-3">{card.subtitle}</p>
            <p className="text-3xl font-bold text-gray-900">
              {card.value.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500 mt-1">tCO₂e</p>
          </div>
        ))}
      </div>

      {/* Total Card */}
      <div className="bg-green-700 rounded-xl shadow-md p-8 text-white">
        <p className="text-green-200 text-sm font-medium uppercase tracking-wide">
          Total Emissions
        </p>
        <p className="text-5xl font-bold mt-2">{total.toFixed(2)}</p>
        <p className="text-green-200 text-lg mt-1">tCO₂e — {year}</p>
        <p className="text-green-300 text-sm mt-4">
          Scope 1 + Scope 2 + Scope 3 combined
        </p>
      </div>
    </div>
  );
}
