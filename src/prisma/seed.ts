/**
 * Prisma seed script for GreenLedger demo data.
 * Run via: DATABASE_URL="file:./prisma/dev.db" npx tsx prisma/seed.ts
 */
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

const SCOPE3_CATEGORIES = [
  { code: "C1", name: "Purchased goods and services" },
  { code: "C2", name: "Capital goods" },
  { code: "C3", name: "Fuel- and energy-related activities" },
  { code: "C4", name: "Upstream transportation and distribution" },
  { code: "C5", name: "Waste generated in operations" },
  { code: "C6", name: "Business travel" },
  { code: "C7", name: "Employee commuting" },
  { code: "C8", name: "Upstream leased assets" },
  { code: "C9", name: "Downstream transportation and distribution" },
  { code: "C10", name: "Processing of sold products" },
  { code: "C11", name: "Use of sold products" },
  { code: "C12", name: "End-of-life treatment of sold products" },
  { code: "C13", name: "Downstream leased assets" },
  { code: "C14", name: "Franchises" },
  { code: "C15", name: "Investments" },
];

async function main() {
  console.log("Seeding demo data…");

  // Company
  const company = await prisma.company.upsert({
    where: { id: "demo-company-1" },
    update: {},
    create: {
      id: "demo-company-1",
      name: "Demo GmbH",
      country: "DE",
      reportingYear: 2024,
      orgBoundary: "operational_control",
    },
  });
  console.log("Company:", company.name);

  // Scope 3 Categories
  const categoryIds: Record<string, string> = {};
  for (const cat of SCOPE3_CATEGORIES) {
    const upserted = await prisma.scope3Category.upsert({
      where: { id: `cat-${cat.code}` },
      update: {},
      create: {
        id: `cat-${cat.code}`,
        code: cat.code,
        name: cat.name,
        material: cat.code === "C1" || cat.code === "C4",
        materialityReason:
          cat.code === "C1"
            ? "Largest emission source in value chain"
            : cat.code === "C4"
            ? "Significant logistics footprint"
            : null,
      },
    });
    categoryIds[cat.code] = upserted.id;
  }
  console.log("Categories seeded:", SCOPE3_CATEGORIES.length);

  // Suppliers
  const suppliers = [
    {
      id: "supplier-1",
      name: "Alpine Steel GmbH",
      country: "DE",
      sector: "Manufacturing",
      contactEmail: "ghg@alpine-steel.de",
    },
    {
      id: "supplier-2",
      name: "LogiTrans AG",
      country: "CH",
      sector: "Logistics",
      contactEmail: "esg@logitrans.ch",
    },
    {
      id: "supplier-3",
      name: "CleanPack SL",
      country: "ES",
      sector: "Packaging",
      contactEmail: "sustainability@cleanpack.es",
    },
  ];

  for (const s of suppliers) {
    await prisma.supplier.upsert({
      where: { id: s.id },
      update: {},
      create: {
        ...s,
        companyId: company.id,
        publicFormToken: crypto.randomUUID(),
        status: "active",
      },
    });
  }
  console.log("Suppliers seeded:", suppliers.length);

  // Scope 1 Records
  await prisma.scope1Record.upsert({
    where: { id: "s1-2024-1" },
    update: {},
    create: {
      id: "s1-2024-1",
      companyId: company.id,
      periodYear: 2024,
      valueTco2e: 120.5,
      calculationMethod: "combustion / IPCC AR6",
      emissionFactorsSource: "DEFRA 2023",
      dataSource: "manual",
      assumptions: "Natural gas consumption from meter readings",
    },
  });

  // Scope 2 Records
  await prisma.scope2Record.upsert({
    where: { id: "s2-2024-1" },
    update: {},
    create: {
      id: "s2-2024-1",
      companyId: company.id,
      periodYear: 2024,
      valueTco2e: 85.0,
      calculationMethod: "location-based",
      emissionFactorsSource: "IEA 2023 grid factors",
      dataSource: "manual",
      assumptions: "Grid electricity, German grid mix",
    },
  });

  // Scope 3 Records
  await prisma.scope3Record.upsert({
    where: { id: "s3-2024-1" },
    update: {},
    create: {
      id: "s3-2024-1",
      companyId: company.id,
      supplierId: "supplier-1",
      categoryId: categoryIds["C1"],
      periodYear: 2024,
      valueTco2e: 540.0,
      calculationMethod: "spend_based",
      emissionFactorSource: "DEFRA 2023 spend-based factors",
      dataSource: "proxy",
      assumptions: "Spend-based proxy; DEFRA 2023 manufacturing sector",
      confidence: 0.6,
      activityDataJson: JSON.stringify({ spendEur: 1200000 }),
    },
  });

  await prisma.scope3Record.upsert({
    where: { id: "s3-2024-2" },
    update: {},
    create: {
      id: "s3-2024-2",
      companyId: company.id,
      supplierId: "supplier-2",
      categoryId: categoryIds["C4"],
      periodYear: 2024,
      valueTco2e: 78.4,
      calculationMethod: "activity_based",
      emissionFactorSource: "GLEC Framework 2023",
      dataSource: "supplier_form",
      assumptions: "Road freight, European routes",
      confidence: 0.8,
      activityDataJson: JSON.stringify({ tonKm: 392000 }),
    },
  });

  // Methodology Notes
  await prisma.methodologyNote.upsert({
    where: { id: "meth-scope1" },
    update: {},
    create: {
      id: "meth-scope1",
      companyId: company.id,
      scope: "scope_1",
      text:
        "Scope 1 emissions are calculated using the combustion method per IPCC AR6 guidelines. " +
        "Energy consumption data is sourced from utility meter readings and fuel purchase records. " +
        "Emission factors are from DEFRA 2023.",
    },
  });

  await prisma.methodologyNote.upsert({
    where: { id: "meth-scope2" },
    update: {},
    create: {
      id: "meth-scope2",
      companyId: company.id,
      scope: "scope_2",
      text:
        "Scope 2 emissions use the location-based method with IEA 2023 country-level grid emission factors. " +
        "Electricity consumption is measured at all operational sites.",
    },
  });

  await prisma.methodologyNote.upsert({
    where: { id: "meth-scope3" },
    update: {},
    create: {
      id: "meth-scope3",
      companyId: company.id,
      scope: "scope_3",
      text:
        "Scope 3 emissions are calculated using a spend-based proxy approach (DEFRA 2023 spend-based factors) " +
        "for purchased goods and services (C1) and activity-based data for upstream transport (C4). " +
        "Supplier-specific data will be collected in future reporting cycles via the GreenLedger supplier portal.",
    },
  });

  console.log("Seed complete ✓");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
