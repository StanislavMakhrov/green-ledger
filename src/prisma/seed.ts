import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { randomUUID } from "crypto";

const databaseUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new PrismaLibSql({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

const DEMO_COMPANY_ID = "demo-company-001";

const SCOPE3_CATEGORIES = [
  {
    code: "C1",
    name: "Purchased goods and services",
    material: true,
    materialityReason: "Largest upstream source",
  },
  {
    code: "C2",
    name: "Capital goods",
    material: false,
    materialityReason: null,
  },
  {
    code: "C3",
    name: "Fuel- and energy-related activities",
    material: false,
    materialityReason: null,
  },
  {
    code: "C4",
    name: "Upstream transportation and distribution",
    material: true,
    materialityReason: "Key logistics footprint",
  },
  {
    code: "C5",
    name: "Waste generated in operations",
    material: false,
    materialityReason: null,
  },
  {
    code: "C6",
    name: "Business travel",
    material: false,
    materialityReason: null,
  },
  {
    code: "C7",
    name: "Employee commuting",
    material: false,
    materialityReason: null,
  },
  {
    code: "C8",
    name: "Upstream leased assets",
    material: false,
    materialityReason: null,
  },
  {
    code: "C9",
    name: "Downstream transportation and distribution",
    material: false,
    materialityReason: null,
  },
  {
    code: "C10",
    name: "Processing of sold products",
    material: false,
    materialityReason: null,
  },
  {
    code: "C11",
    name: "Use of sold products",
    material: false,
    materialityReason: null,
  },
  {
    code: "C12",
    name: "End-of-life treatment of sold products",
    material: false,
    materialityReason: null,
  },
  {
    code: "C13",
    name: "Downstream leased assets",
    material: false,
    materialityReason: null,
  },
  {
    code: "C14",
    name: "Franchises",
    material: false,
    materialityReason: null,
  },
  {
    code: "C15",
    name: "Investments",
    material: false,
    materialityReason: null,
  },
];

async function main() {
  // Upsert demo company
  await prisma.company.upsert({
    where: { id: DEMO_COMPANY_ID },
    update: {},
    create: {
      id: DEMO_COMPANY_ID,
      name: "Demo GmbH",
      country: "DE",
      reportingYear: 2024,
      orgBoundary: "operational_control",
    },
  });

  // Upsert Scope 3 categories (static reference data)
  for (const cat of SCOPE3_CATEGORIES) {
    await prisma.scope3Category.upsert({
      where: { code: cat.code },
      update: {},
      create: cat,
    });
  }

  // Seed demo Scope 1 records (idempotent: only if none exist)
  const scope1Count = await prisma.scope1Record.count({
    where: { companyId: DEMO_COMPANY_ID },
  });
  if (scope1Count === 0) {
    await prisma.scope1Record.create({
      data: {
        companyId: DEMO_COMPANY_ID,
        periodYear: 2024,
        valueTco2e: 120.5,
        calculationMethod: "Direct measurement",
        emissionFactorsSource: "IPCC AR6",
        dataSource: "manual",
        assumptions: "Natural gas boiler readings from utility bills",
      },
    });
  }

  // Seed demo Scope 2 records (idempotent)
  const scope2Count = await prisma.scope2Record.count({
    where: { companyId: DEMO_COMPANY_ID },
  });
  if (scope2Count === 0) {
    await prisma.scope2Record.create({
      data: {
        companyId: DEMO_COMPANY_ID,
        periodYear: 2024,
        valueTco2e: 85.2,
        calculationMethod: "Location-based",
        emissionFactorsSource: "UBA 2023 German grid factor",
        dataSource: "manual",
        assumptions: "Grid emission factor 0.434 kgCO2e/kWh",
      },
    });
  }

  // Seed demo supplier (idempotent)
  const supplierCount = await prisma.supplier.count({
    where: { companyId: DEMO_COMPANY_ID },
  });
  if (supplierCount === 0) {
    await prisma.supplier.create({
      data: {
        companyId: DEMO_COMPANY_ID,
        name: "Acme Lieferant GmbH",
        country: "DE",
        sector: "Manufacturing",
        contactEmail: "contact@acme-lieferant.de",
        publicFormToken: randomUUID(),
        status: "active",
      },
    });
  }

  // Seed methodology notes (idempotent)
  for (const scope of ["scope_1", "scope_2", "scope_3"] as const) {
    const existing = await prisma.methodologyNote.findFirst({
      where: { companyId: DEMO_COMPANY_ID, scope },
    });
    if (!existing) {
      await prisma.methodologyNote.create({
        data: {
          companyId: DEMO_COMPANY_ID,
          scope,
          text: `Default methodology note for ${scope.replace("_", " ")}.`,
        },
      });
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
