// Use relative path here because this file is executed via `tsx` (prisma db seed),
// not through Next.js. The `@/` alias resolves correctly via tsconfig.json.
import { PrismaClient } from "@/app/generated/prisma/client";
import { DEMO_COMPANY_ID } from "@/lib/constants";

const prisma = new PrismaClient();

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

  // Seed Scope 3 categories (C1-C15)
  const categories = [
    { code: "C1", name: "Purchased goods and services", material: true, materialityReason: "Largest category for manufacturing SMEs" },
    { code: "C2", name: "Capital goods", material: false, materialityReason: null },
    { code: "C3", name: "Fuel- and energy-related activities", material: false, materialityReason: null },
    { code: "C4", name: "Upstream transportation and distribution", material: true, materialityReason: "Significant for product-heavy businesses" },
    { code: "C5", name: "Waste generated in operations", material: false, materialityReason: null },
    { code: "C6", name: "Business travel", material: false, materialityReason: null },
    { code: "C7", name: "Employee commuting", material: false, materialityReason: null },
    { code: "C8", name: "Upstream leased assets", material: false, materialityReason: null },
    { code: "C9", name: "Downstream transportation and distribution", material: false, materialityReason: null },
    { code: "C10", name: "Processing of sold products", material: false, materialityReason: null },
    { code: "C11", name: "Use of sold products", material: false, materialityReason: null },
    { code: "C12", name: "End-of-life treatment of sold products", material: false, materialityReason: null },
    { code: "C13", name: "Downstream leased assets", material: false, materialityReason: null },
    { code: "C14", name: "Franchises", material: false, materialityReason: null },
    { code: "C15", name: "Investments", material: false, materialityReason: null },
  ];

  for (const cat of categories) {
    const existing = await prisma.scope3Category.findFirst({ where: { code: cat.code } });
    if (!existing) {
      await prisma.scope3Category.create({ data: { ...cat, id: crypto.randomUUID() } });
    }
  }

  // Seed demo suppliers
  const suppliers = [
    { name: "Steel Supplier GmbH", country: "DE", sector: "Manufacturing", contactEmail: "contact@steel-supplier.de" },
    { name: "Logistics Partner AG", country: "DE", sector: "Transport", contactEmail: "info@logistics-partner.de" },
    { name: "Raw Materials Ltd", country: "PL", sector: "Mining", contactEmail: "orders@raw-materials.pl" },
  ];

  for (const sup of suppliers) {
    const existing = await prisma.supplier.findFirst({ where: { name: sup.name, companyId: DEMO_COMPANY_ID } });
    if (!existing) {
      await prisma.supplier.create({
        data: {
          id: crypto.randomUUID(),
          ...sup,
          companyId: DEMO_COMPANY_ID,
          publicFormToken: crypto.randomUUID(),
          status: "active",
        },
      });
    }
  }

  // Seed some Scope 1 records
  const scope1Count = await prisma.scope1Record.count({ where: { companyId: DEMO_COMPANY_ID } });
  if (scope1Count === 0) {
    await prisma.scope1Record.create({
      data: {
        id: crypto.randomUUID(),
        companyId: DEMO_COMPANY_ID,
        periodYear: 2024,
        valueTco2e: 125.5,
        calculationMethod: "Direct measurement from gas meters",
        emissionFactorsSource: "DEFRA 2023",
        dataSource: "manual",
        assumptions: "Natural gas combustion at main facility",
      },
    });
  }

  // Seed some Scope 2 records
  const scope2Count = await prisma.scope2Record.count({ where: { companyId: DEMO_COMPANY_ID } });
  if (scope2Count === 0) {
    await prisma.scope2Record.create({
      data: {
        id: crypto.randomUUID(),
        companyId: DEMO_COMPANY_ID,
        periodYear: 2024,
        valueTco2e: 87.3,
        calculationMethod: "Location-based method",
        emissionFactorsSource: "German grid emission factor 2023 (UBA)",
        dataSource: "manual",
        assumptions: "Electricity consumption from grid, location-based method",
      },
    });
  }

  // Seed methodology notes
  const methodologyScopes = ["scope_1", "scope_2", "scope_3"] as const;
  const methodologyTexts = {
    scope_1: "Direct emissions from owned or controlled sources. Natural gas combustion calculated using DEFRA 2023 emission factors applied to metered consumption data.",
    scope_2: "Indirect emissions from purchased electricity. Location-based method applied using the German grid average emission factor published by the Umweltbundesamt (UBA) for 2023.",
    scope_3: "Upstream and downstream indirect emissions. Scope 3 categories C1 and C4 are assessed as material. Supplier-specific data collected via the GreenLedger supplier form. Where supplier-specific data is unavailable, spend-based proxy emission factors (DEFRA) are applied with a confidence rating of 0.5.",
  };

  for (const scope of methodologyScopes) {
    const existing = await prisma.methodologyNote.findFirst({ where: { companyId: DEMO_COMPANY_ID, scope } });
    if (!existing) {
      await prisma.methodologyNote.create({
        data: {
          id: crypto.randomUUID(),
          companyId: DEMO_COMPANY_ID,
          scope,
          text: methodologyTexts[scope],
        },
      });
    }
  }

  console.log("✅ Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
