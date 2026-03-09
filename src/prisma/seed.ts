import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_COMPANY_ID = "demo-company-001";
const REPORTING_YEAR = parseInt(process.env.REPORTING_YEAR ?? "2024", 10);

const SCOPE3_CATEGORIES = [
  { code: "C1", name: "Purchased goods & services" },
  { code: "C2", name: "Capital goods" },
  { code: "C3", name: "Fuel- and energy-related activities" },
  { code: "C4", name: "Upstream transportation & distribution" },
  { code: "C5", name: "Waste generated in operations" },
  { code: "C6", name: "Business travel" },
  { code: "C7", name: "Employee commuting" },
  { code: "C8", name: "Upstream leased assets" },
  { code: "C9", name: "Downstream transportation & distribution" },
  { code: "C10", name: "Processing of sold products" },
  { code: "C11", name: "Use of sold products" },
  { code: "C12", name: "End-of-life treatment of sold products" },
  { code: "C13", name: "Downstream leased assets" },
  { code: "C14", name: "Franchises" },
  { code: "C15", name: "Investments" },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Company
  const company = await prisma.company.upsert({
    where: { id: DEMO_COMPANY_ID },
    update: {},
    create: {
      id: DEMO_COMPANY_ID,
      name: "Demo GmbH",
      country: "DE",
      reportingYear: REPORTING_YEAR,
      orgBoundary: "operational_control",
    },
  });
  console.log("✅ Company:", company.name);

  // Scope 3 Categories
  for (const cat of SCOPE3_CATEGORIES) {
    const isMaterial = ["C1", "C3", "C4"].includes(cat.code);
    const materialityReason = isMaterial
      ? cat.code === "C1"
        ? "High spend volume with multiple suppliers; primary emission source."
        : cat.code === "C3"
          ? "Significant fuel consumption reported in energy audit."
          : "Frequent upstream logistics with high freight volume."
      : undefined;

    await prisma.scope3Category.upsert({
      where: { code: cat.code },
      update: {},
      create: {
        code: cat.code,
        name: cat.name,
        material: isMaterial,
        materialityReason,
      },
    });
  }
  console.log("✅ Scope 3 categories seeded (15 total)");

  // Suppliers
  const supplier1 = await prisma.supplier.upsert({
    where: { publicFormToken: "token-acme-logistics-001" },
    update: {},
    create: {
      companyId: DEMO_COMPANY_ID,
      name: "Acme Logistics GmbH",
      country: "DE",
      sector: "Logistics",
      contactEmail: "contact@acme-logistics.de",
      publicFormToken: "token-acme-logistics-001",
      status: "active",
    },
  });

  const supplier2 = await prisma.supplier.upsert({
    where: { publicFormToken: "token-baustoff-mueller-002" },
    update: {},
    create: {
      companyId: DEMO_COMPANY_ID,
      name: "BauStoff Müller AG",
      country: "DE",
      sector: "Manufacturing",
      contactEmail: "info@baustoff-mueller.de",
      publicFormToken: "token-baustoff-mueller-002",
      status: "active",
    },
  });

  const supplier3 = await prisma.supplier.upsert({
    where: { publicFormToken: "token-green-energy-003" },
    update: {},
    create: {
      companyId: DEMO_COMPANY_ID,
      name: "Green Energy Solutions GmbH",
      country: "AT",
      sector: "Energy",
      contactEmail: "sustainability@greenenergy.at",
      publicFormToken: "token-green-energy-003",
      status: "active",
    },
  });
  console.log("✅ Suppliers seeded");

  // Scope 1 Records
  await prisma.scope1Record.upsert({
    where: { id: "scope1-demo-001" },
    update: {},
    create: {
      id: "scope1-demo-001",
      companyId: DEMO_COMPANY_ID,
      periodYear: REPORTING_YEAR,
      valueTco2e: 45.2,
      calculationMethod: "Direct measurement - combustion",
      emissionFactorsSource: "DEFRA 2023",
      dataSource: "manual",
      assumptions: "Natural gas consumption from facility energy bills",
    },
  });

  await prisma.scope1Record.upsert({
    where: { id: "scope1-demo-002" },
    update: {},
    create: {
      id: "scope1-demo-002",
      companyId: DEMO_COMPANY_ID,
      periodYear: REPORTING_YEAR,
      valueTco2e: 12.8,
      calculationMethod: "Vehicle fuel consumption",
      emissionFactorsSource: "DEFRA 2023",
      dataSource: "manual",
      assumptions: "Fleet vehicles diesel consumption from fuel cards",
    },
  });
  console.log("✅ Scope 1 records seeded");

  // Scope 2 Records
  await prisma.scope2Record.upsert({
    where: { id: "scope2-demo-001" },
    update: {},
    create: {
      id: "scope2-demo-001",
      companyId: DEMO_COMPANY_ID,
      periodYear: REPORTING_YEAR,
      valueTco2e: 38.5,
      calculationMethod: "Location-based method",
      emissionFactorsSource: "German grid emission factor 2023",
      dataSource: "manual",
      assumptions: "Electricity consumption from utility bills; grid factor 0.385 kgCO2e/kWh",
    },
  });

  await prisma.scope2Record.upsert({
    where: { id: "scope2-demo-002" },
    update: {},
    create: {
      id: "scope2-demo-002",
      companyId: DEMO_COMPANY_ID,
      periodYear: REPORTING_YEAR,
      valueTco2e: 8.1,
      calculationMethod: "Location-based method",
      emissionFactorsSource: "German grid emission factor 2023",
      dataSource: "manual",
      assumptions: "District heating consumption Q3-Q4 only",
    },
  });
  console.log("✅ Scope 2 records seeded");

  // Get category IDs for Scope 3 records
  const catC1 = await prisma.scope3Category.findUnique({ where: { code: "C1" } });
  const catC3 = await prisma.scope3Category.findUnique({ where: { code: "C3" } });
  const catC4 = await prisma.scope3Category.findUnique({ where: { code: "C4" } });

  if (!catC1 || !catC3 || !catC4) {
    throw new Error("Required categories not found");
  }

  // Scope 3 Records
  await prisma.scope3Record.upsert({
    where: { id: "scope3-demo-001" },
    update: {},
    create: {
      id: "scope3-demo-001",
      companyId: DEMO_COMPANY_ID,
      supplierId: supplier1.id,
      categoryId: catC1.id,
      periodYear: REPORTING_YEAR,
      valueTco2e: 233.0,
      calculationMethod: "spend_based",
      emissionFactorSource: "DEFRA 2023 spend-based proxy",
      dataSource: "supplier_form",
      assumptions:
        "Spend-based proxy estimate using DEFRA 2023 factor: 0.233 tCO₂e/EUR. This is a placeholder value for demonstration purposes only.",
      confidence: 0.4,
      activityDataJson: JSON.stringify({ spend_eur: 1000 }),
    },
  });

  await prisma.scope3Record.upsert({
    where: { id: "scope3-demo-002" },
    update: {},
    create: {
      id: "scope3-demo-002",
      companyId: DEMO_COMPANY_ID,
      supplierId: supplier2.id,
      categoryId: catC4.id,
      periodYear: REPORTING_YEAR,
      valueTco2e: 5.1,
      calculationMethod: "activity_based",
      emissionFactorSource: "DEFRA 2023 HGV road freight",
      dataSource: "supplier_form",
      assumptions:
        "Activity-based transport estimate using DEFRA 2023 HGV factor: 0.000102 tCO₂e/tonne-km. This is a placeholder value for demonstration purposes only.",
      confidence: 0.5,
      activityDataJson: JSON.stringify({ ton_km: 50000 }),
    },
  });

  await prisma.scope3Record.upsert({
    where: { id: "scope3-demo-003" },
    update: {},
    create: {
      id: "scope3-demo-003",
      companyId: DEMO_COMPANY_ID,
      categoryId: catC3.id,
      periodYear: REPORTING_YEAR,
      valueTco2e: 18.7,
      calculationMethod: "supplier_specific",
      emissionFactorSource: "Supplier-provided data",
      dataSource: "proxy",
      assumptions: "Estimated based on energy audit report",
      confidence: 0.7,
    },
  });
  console.log("✅ Scope 3 records seeded");

  // Methodology Notes
  await prisma.methodologyNote.upsert({
    where: { companyId_scope: { companyId: DEMO_COMPANY_ID, scope: "scope_1" } },
    update: {},
    create: {
      companyId: DEMO_COMPANY_ID,
      scope: "scope_1",
      text: "Scope 1 emissions cover direct greenhouse gas emissions from sources owned or controlled by Demo GmbH, including natural gas combustion for heating and diesel fuel consumption from company vehicles. Emission factors are sourced from DEFRA 2023 GHG Reporting guidelines. Measurement period: full calendar year 2024.",
    },
  });

  await prisma.methodologyNote.upsert({
    where: { companyId_scope: { companyId: DEMO_COMPANY_ID, scope: "scope_2" } },
    update: {},
    create: {
      companyId: DEMO_COMPANY_ID,
      scope: "scope_2",
      text: "Scope 2 emissions are calculated using the location-based method, reflecting the average emissions intensity of the German electricity grid. Grid emission factor: 0.385 kgCO₂e/kWh (Umweltbundesamt 2023). District heating consumption estimated from utility invoices. Market-based method not applied in this reporting period.",
    },
  });

  await prisma.methodologyNote.upsert({
    where: { companyId_scope: { companyId: DEMO_COMPANY_ID, scope: "scope_3" } },
    update: {},
    create: {
      companyId: DEMO_COMPANY_ID,
      scope: "scope_3",
      text: "Scope 3 emissions are calculated for material categories identified through a screening assessment. Category C1 (Purchased goods & services) uses spend-based proxy estimation with DEFRA 2023 factors. Category C4 (Upstream transportation) uses tonne-kilometre activity data provided by logistics suppliers. Proxy factors are clearly documented as DEMO PLACEHOLDERS and are not authoritative regulatory values. Confidence scores reflect data quality: 0.4 = proxy estimate, 0.5 = activity-based proxy, 0.7–1.0 = verified supplier data.",
    },
  });
  console.log("✅ Methodology notes seeded");

  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
