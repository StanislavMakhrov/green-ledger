import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

const DEMO_COMPANY_ID = "demo-company-001";
const YEAR = 2024;

async function main() {
  console.log("🌱 Seeding database…");

  // Company
  const company = await prisma.company.upsert({
    where: { id: DEMO_COMPANY_ID },
    update: {},
    create: {
      id: DEMO_COMPANY_ID,
      name: "Muster GmbH",
      country: "DE",
      reportingYear: YEAR,
      orgBoundary: "operational_control",
    },
  });
  console.log(`  Company: ${company.name}`);

  // Scope3 Categories C1..C15
  const categoryDefs = [
    { code: "C1", name: "C1: Purchased goods & services", material: true },
    { code: "C2", name: "C2: Capital goods", material: false },
    { code: "C3", name: "C3: Fuel- and energy-related activities", material: false },
    { code: "C4", name: "C4: Upstream transportation & distribution", material: false },
    { code: "C5", name: "C5: Waste generated in operations", material: false },
    { code: "C6", name: "C6: Business travel", material: true },
    { code: "C7", name: "C7: Employee commuting", material: false },
    { code: "C8", name: "C8: Upstream leased assets", material: false },
    { code: "C9", name: "C9: Downstream transportation & distribution", material: false },
    { code: "C10", name: "C10: Processing of sold products", material: false },
    { code: "C11", name: "C11: Use of sold products", material: true },
    { code: "C12", name: "C12: End-of-life treatment of sold products", material: false },
    { code: "C13", name: "C13: Downstream leased assets", material: false },
    { code: "C14", name: "C14: Franchises", material: false },
    { code: "C15", name: "C15: Investments", material: false },
  ];

  const categories: Array<{ id: string; code: string }> = [];
  for (const def of categoryDefs) {
    const existing = await prisma.scope3Category.findFirst({
      where: { code: def.code },
    });
    if (existing) {
      categories.push(existing);
    } else {
      const cat = await prisma.scope3Category.create({ data: def });
      categories.push(cat);
    }
  }
  console.log(`  ${categories.length} Scope3 categories seeded`);

  // Suppliers
  const supplierDefs = [
    {
      name: "Acme Logistics GmbH",
      country: "DE",
      sector: "logistics",
      contactEmail: "emissions@acme-logistics.de",
    },
    {
      name: "Sunrise Manufacturing AG",
      country: "CH",
      sector: "manufacturing",
      contactEmail: "csrd@sunrise-mfg.ch",
    },
    {
      name: "BioPackaging Kft",
      country: "HU",
      sector: "packaging",
      contactEmail: "sustainability@biopack.hu",
    },
  ];

  const suppliers: Array<{ id: string }> = [];
  for (const def of supplierDefs) {
    const existing = await prisma.supplier.findFirst({
      where: { companyId: DEMO_COMPANY_ID, name: def.name },
    });
    if (existing) {
      suppliers.push(existing);
    } else {
      const sup = await prisma.supplier.create({
        data: {
          ...def,
          companyId: DEMO_COMPANY_ID,
          publicFormToken: randomUUID(),
          status: "active",
        },
      });
      suppliers.push(sup);
    }
  }
  console.log(`  ${suppliers.length} suppliers seeded`);

  // Scope1 Records
  const scope1Defs = [
    {
      valueTco2e: 45.2,
      calculationMethod: "direct measurement",
      emissionFactorsSource: "DEFRA 2023",
      dataSource: "manual",
      assumptions: "Natural gas combustion in office heating",
    },
    {
      valueTco2e: 12.8,
      calculationMethod: "fuel consumption × emission factor",
      emissionFactorsSource: "DEFRA 2023",
      dataSource: "manual",
      assumptions: "Company vehicle fleet – diesel",
    },
  ];

  for (const def of scope1Defs) {
    const existing = await prisma.scope1Record.findFirst({
      where: {
        companyId: DEMO_COMPANY_ID,
        periodYear: YEAR,
        assumptions: def.assumptions,
      },
    });
    if (!existing) {
      await prisma.scope1Record.create({
        data: { ...def, companyId: DEMO_COMPANY_ID, periodYear: YEAR },
      });
    }
  }
  console.log("  Scope1 records seeded");

  // Scope2 Records
  const scope2Defs = [
    {
      valueTco2e: 38.6,
      calculationMethod: "location-based",
      emissionFactorsSource: "IEA 2023 Germany grid",
      dataSource: "manual",
      assumptions: "Office electricity consumption 2024",
    },
  ];

  for (const def of scope2Defs) {
    const existing = await prisma.scope2Record.findFirst({
      where: {
        companyId: DEMO_COMPANY_ID,
        periodYear: YEAR,
        assumptions: def.assumptions,
      },
    });
    if (!existing) {
      await prisma.scope2Record.create({
        data: { ...def, companyId: DEMO_COMPANY_ID, periodYear: YEAR },
      });
    }
  }
  console.log("  Scope2 records seeded");

  // Scope3 Records
  const c1 = categories.find((c) => c.code === "C1")!;
  const c6 = categories.find((c) => c.code === "C6")!;

  const scope3Defs = [
    {
      supplierId: suppliers[0].id,
      categoryId: c1.id,
      valueTco2e: 210.4,
      calculationMethod: "spend_based",
      emissionFactorSource: "DEFRA 2023 spend-based proxy",
      dataSource: "supplier_form",
      assumptions: "Estimated from spend data provided by supplier",
      confidence: 0.6,
    },
    {
      supplierId: suppliers[1].id,
      categoryId: c1.id,
      valueTco2e: 155.9,
      calculationMethod: "spend_based",
      emissionFactorSource: "DEFRA 2023 spend-based proxy",
      dataSource: "supplier_form",
      assumptions: "Estimated from spend data provided by supplier",
      confidence: 0.6,
    },
    {
      supplierId: null,
      categoryId: c6.id,
      valueTco2e: 8.3,
      calculationMethod: "activity_based",
      emissionFactorSource: "DEFRA 2023 transport activity",
      dataSource: "proxy",
      assumptions: "Business flights estimated from travel budget",
      confidence: 0.8,
    },
  ];

  for (const def of scope3Defs) {
    await prisma.scope3Record.create({
      data: {
        ...def,
        companyId: DEMO_COMPANY_ID,
        periodYear: YEAR,
        activityDataJson: null,
      },
    });
  }
  console.log("  Scope3 records seeded");

  // Methodology Notes
  const methodologyDefs = [
    {
      scope: "scope_1",
      text: "Scope 1 emissions cover direct combustion of natural gas for office heating and diesel used in company vehicles. Emission factors sourced from DEFRA 2023 conversion factors. Activity data collected via monthly fuel invoices.",
    },
    {
      scope: "scope_2",
      text: "Scope 2 emissions calculated using the location-based method. Electricity consumption measured via smart meters. German grid emission factor applied from IEA 2023 statistics (0.365 kg CO₂e/kWh).",
    },
    {
      scope: "scope_3",
      text: "Scope 3 covers material categories C1 (Purchased goods & services), C6 (Business travel), and C11 (Use of sold products). Supplier data collected via direct supplier forms; spend-based proxy factors (DEFRA 2023) applied where direct data is unavailable.",
    },
  ];

  for (const def of methodologyDefs) {
    const existing = await prisma.methodologyNote.findFirst({
      where: { companyId: DEMO_COMPANY_ID, scope: def.scope },
    });
    if (!existing) {
      await prisma.methodologyNote.create({
        data: { ...def, companyId: DEMO_COMPANY_ID },
      });
    }
  }
  console.log("  Methodology notes seeded");

  // Audit Trail Events
  await prisma.auditTrailEvent.createMany({
    data: [
      {
        companyId: DEMO_COMPANY_ID,
        entityType: "supplier",
        entityId: suppliers[0].id,
        action: "created",
        actor: "user",
        comment: "Initial supplier setup",
      },
      {
        companyId: DEMO_COMPANY_ID,
        entityType: "scope3",
        entityId: "seed-demo",
        action: "submitted",
        actor: "supplier",
        comment: "Demo seed data",
      },
    ],
  });
  console.log("  Audit trail events seeded");

  console.log("✅ Seeding complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
