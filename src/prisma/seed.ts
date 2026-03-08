import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

const DEMO_COMPANY_ID = "demo-company-001";

const SCOPE3_CATEGORIES = [
  { code: "C1", name: "Purchased goods & services", material: true },
  { code: "C2", name: "Capital goods", material: false },
  { code: "C3", name: "Fuel- and energy-related activities", material: false },
  { code: "C4", name: "Upstream transportation & distribution", material: false },
  { code: "C5", name: "Waste generated in operations", material: false },
  { code: "C6", name: "Business travel", material: false },
  { code: "C7", name: "Employee commuting", material: false },
  { code: "C8", name: "Upstream leased assets", material: false },
  { code: "C9", name: "Downstream transportation & distribution", material: false },
  { code: "C10", name: "Processing of sold products", material: false },
  { code: "C11", name: "Use of sold products", material: true },
  { code: "C12", name: "End-of-life treatment of sold products", material: false },
  { code: "C13", name: "Downstream leased assets", material: false },
  { code: "C14", name: "Franchises", material: false },
  { code: "C15", name: "Investments", material: false },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Upsert company
  await prisma.company.upsert({
    where: { id: DEMO_COMPANY_ID },
    update: {},
    create: {
      id: DEMO_COMPANY_ID,
      name: "Acme GmbH",
      country: "DE",
      reportingYear: 2024,
      orgBoundary: "operational_control",
    },
  });

  // Seed Scope 3 categories
  const categoryIds: Record<string, string> = {};
  for (const cat of SCOPE3_CATEGORIES) {
    const existing = await prisma.scope3Category.findFirst({
      where: { code: cat.code },
    });
    if (existing) {
      categoryIds[cat.code] = existing.id;
    } else {
      const created = await prisma.scope3Category.create({
        data: {
          id: randomUUID(),
          code: cat.code,
          name: cat.name,
          material: cat.material,
        },
      });
      categoryIds[cat.code] = created.id;
    }
  }

  // Seed suppliers
  const suppliers = [
    {
      id: "supplier-001",
      name: "SteelWorks AG",
      country: "DE",
      sector: "Manufacturing",
      contactEmail: "emissions@steelworks.de",
      publicFormToken: "tok-steelworks-2024",
    },
    {
      id: "supplier-002",
      name: "FastFreight GmbH",
      country: "AT",
      sector: "Logistics",
      contactEmail: "sustainability@fastfreight.at",
      publicFormToken: "tok-fastfreight-2024",
    },
    {
      id: "supplier-003",
      name: "CleanPack SL",
      country: "ES",
      sector: "Packaging",
      contactEmail: "esg@cleanpack.es",
      publicFormToken: "tok-cleanpack-2024",
    },
  ];

  for (const supplier of suppliers) {
    await prisma.supplier.upsert({
      where: { id: supplier.id },
      update: {},
      create: { ...supplier, companyId: DEMO_COMPANY_ID, status: "active" },
    });
  }

  // Scope 1 records
  const scope1Existing = await prisma.scope1Record.count({
    where: { companyId: DEMO_COMPANY_ID },
  });
  if (scope1Existing === 0) {
    await prisma.scope1Record.createMany({
      data: [
        {
          companyId: DEMO_COMPANY_ID,
          periodYear: 2024,
          valueTco2e: 120.5,
          calculationMethod: "combustion_stoichiometry",
          emissionFactorsSource: "DEFRA 2023",
          dataSource: "manual",
          assumptions: "Natural gas boiler, 90% efficiency",
        },
        {
          companyId: DEMO_COMPANY_ID,
          periodYear: 2024,
          valueTco2e: 45.2,
          calculationMethod: "fuel_consumption",
          emissionFactorsSource: "DEFRA 2023",
          dataSource: "manual",
          assumptions: "Company vehicle fleet",
        },
      ],
    });
  }

  // Scope 2 records
  const scope2Existing = await prisma.scope2Record.count({
    where: { companyId: DEMO_COMPANY_ID },
  });
  if (scope2Existing === 0) {
    await prisma.scope2Record.createMany({
      data: [
        {
          companyId: DEMO_COMPANY_ID,
          periodYear: 2024,
          valueTco2e: 88.3,
          calculationMethod: "market_based",
          emissionFactorsSource: "AIB European Residual Mix 2023",
          dataSource: "manual",
          assumptions: "Green electricity contract",
        },
        {
          companyId: DEMO_COMPANY_ID,
          periodYear: 2024,
          valueTco2e: 12.1,
          calculationMethod: "location_based",
          emissionFactorsSource: "IEA 2023",
          dataSource: "manual",
        },
      ],
    });
  }

  // Scope 3 records
  const scope3Existing = await prisma.scope3Record.count({
    where: { companyId: DEMO_COMPANY_ID },
  });
  if (scope3Existing === 0) {
    await prisma.scope3Record.createMany({
      data: [
        {
          companyId: DEMO_COMPANY_ID,
          supplierId: "supplier-001",
          categoryId: categoryIds["C1"],
          periodYear: 2024,
          valueTco2e: 340.7,
          calculationMethod: "supplier_specific",
          emissionFactorSource: "Supplier EPD",
          dataSource: "supplier_form",
          confidence: 0.9,
          assumptions: "Verified by third party",
        },
        {
          companyId: DEMO_COMPANY_ID,
          supplierId: "supplier-002",
          categoryId: categoryIds["C4"],
          periodYear: 2024,
          valueTco2e: 58.6,
          calculationMethod: "activity_based",
          emissionFactorSource: "DEFRA Freight 2023",
          dataSource: "supplier_form",
          confidence: 0.7,
          activityDataJson: JSON.stringify({ ton_km: 945.2 }),
        },
        {
          companyId: DEMO_COMPANY_ID,
          supplierId: null,
          categoryId: categoryIds["C11"],
          periodYear: 2024,
          valueTco2e: 210.0,
          calculationMethod: "spend_based",
          emissionFactorSource: "EEIO proxy",
          dataSource: "proxy",
          confidence: 0.5,
          assumptions: "Spend-based proxy estimate",
        },
      ],
    });
  }

  // Methodology notes
  const methodScopes = ["scope_1", "scope_2", "scope_3"];
  const methodTexts: Record<string, string> = {
    scope_1: "Direct combustion emissions calculated using DEFRA 2023 emission factors. Natural gas consumption measured via utility invoices. Mobile combustion from fleet fuel cards.",
    scope_2: "Electricity consumption from energy management system. Market-based approach with supplier-specific emission factors; AIB residual mix used as fallback.",
    scope_3: "Category C1 (Purchased Goods & Services) and C11 (Use of Sold Products) identified as material via financial hotspot screening. Supplier-specific data collected via supplier form where available; spend-based proxy applied for remaining spend.",
  };

  for (const scope of methodScopes) {
    const existing = await prisma.methodologyNote.findFirst({
      where: { companyId: DEMO_COMPANY_ID, scope },
    });
    if (!existing) {
      await prisma.methodologyNote.create({
        data: {
          companyId: DEMO_COMPANY_ID,
          scope,
          text: methodTexts[scope],
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
  .finally(() => {
    void prisma.$disconnect();
  });
