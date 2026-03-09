import { PrismaClient } from "@prisma/client";
import {
  DEMO_COMPANY_ID,
  PROXY_FACTOR_SOURCE,
  TRANSPORT_FACTOR_SOURCE,
  PROXY_ASSUMPTIONS_SPEND,
  PROXY_ASSUMPTIONS_TRANSPORT,
  PROXY_ASSUMPTIONS_WASTE,
  WASTE_FACTOR_SOURCE,
} from "../lib/constants";

const prisma = new PrismaClient();

async function main() {
  // ── Company ────────────────────────────────────────────────────────────────
  const company = await prisma.company.upsert({
    where: { id: DEMO_COMPANY_ID },
    update: {},
    create: {
      id: DEMO_COMPANY_ID,
      name: "Musterfirma GmbH",
      country: "DE",
      reportingYear: 2024,
      orgBoundary: "operational_control",
    },
  });

  // ── Scope 3 Categories ─────────────────────────────────────────────────────
  const categoryDefs = [
    { code: "C1", name: "Purchased goods & services", material: true, materialityReason: "Primary spend category — purchased goods represent the largest share of supply chain emissions." },
    { code: "C2", name: "Capital goods", material: false, materialityReason: null },
    { code: "C3", name: "Fuel- and energy-related activities", material: false, materialityReason: null },
    { code: "C4", name: "Upstream transportation & distribution", material: true, materialityReason: "Upstream logistics is material for a manufacturing company with distributed suppliers." },
    { code: "C5", name: "Waste generated in operations", material: false, materialityReason: null },
    { code: "C6", name: "Business travel", material: false, materialityReason: null },
    { code: "C7", name: "Employee commuting", material: false, materialityReason: null },
    { code: "C8", name: "Upstream leased assets", material: false, materialityReason: null },
    { code: "C9", name: "Downstream transportation & distribution", material: false, materialityReason: null },
    { code: "C10", name: "Processing of sold products", material: false, materialityReason: null },
    { code: "C11", name: "Use of sold products", material: false, materialityReason: null },
    { code: "C12", name: "End-of-life treatment of sold products", material: false, materialityReason: null },
    { code: "C13", name: "Downstream leased assets", material: false, materialityReason: null },
    { code: "C14", name: "Franchises", material: false, materialityReason: null },
    { code: "C15", name: "Investments", material: false, materialityReason: null },
  ];

  const categoryIds: Record<string, string> = {};
  for (const cat of categoryDefs) {
    const created = await prisma.scope3Category.upsert({
      where: { code: cat.code },
      update: { name: cat.name, material: cat.material, materialityReason: cat.materialityReason },
      create: {
        code: cat.code,
        name: cat.name,
        material: cat.material,
        materialityReason: cat.materialityReason,
      },
    });
    categoryIds[cat.code] = created.id;
  }

  // ── Suppliers ──────────────────────────────────────────────────────────────
  const alpha = await prisma.supplier.upsert({
    where: { publicFormToken: "seed-token-alpha" },
    update: {},
    create: {
      companyId: company.id,
      name: "Lieferant Alpha GmbH",
      country: "DE",
      sector: "Manufacturing",
      contactEmail: "alpha@example.com",
      publicFormToken: "seed-token-alpha",
      status: "active",
    },
  });

  const beta = await prisma.supplier.upsert({
    where: { publicFormToken: "seed-token-beta" },
    update: {},
    create: {
      companyId: company.id,
      name: "Beta Logistics KG",
      country: "DE",
      sector: "Transport",
      contactEmail: "beta@example.com",
      publicFormToken: "seed-token-beta",
      status: "active",
    },
  });

  await prisma.supplier.upsert({
    where: { publicFormToken: "seed-token-gamma" },
    update: {},
    create: {
      companyId: company.id,
      name: "Gamma Werkstoffe AG",
      country: "AT",
      sector: "Raw materials",
      contactEmail: "gamma@example.com",
      publicFormToken: "seed-token-gamma",
      status: "active",
    },
  });

  // ── Scope 1 Records ────────────────────────────────────────────────────────
  const s1a = await prisma.scope1Record.create({
    data: {
      companyId: company.id,
      periodYear: 2024,
      valueTco2e: 45.20,
      calculationMethod: "Natural gas combustion, DEFRA factors",
      emissionFactorsSource: "DEFRA 2023",
      dataSource: "manual",
      assumptions: "Annual gas meter readings from utility invoices.",
    },
  }).catch(() => null);

  const s1b = await prisma.scope1Record.create({
    data: {
      companyId: company.id,
      periodYear: 2024,
      valueTco2e: 12.80,
      calculationMethod: "Company vehicle fleet, DEFRA factors",
      emissionFactorsSource: "DEFRA 2023",
      dataSource: "manual",
      assumptions: "Fuel card data Jan–Dec 2024.",
    },
  }).catch(() => null);

  // ── Scope 2 Record ─────────────────────────────────────────────────────────
  const s2a = await prisma.scope2Record.create({
    data: {
      companyId: company.id,
      periodYear: 2024,
      valueTco2e: 38.50,
      calculationMethod: "Location-based, German grid factor",
      emissionFactorsSource: "UBA 2023",
      dataSource: "manual",
      assumptions: "kWh consumption from utility invoices.",
    },
  }).catch(() => null);

  // ── Scope 3 Records ────────────────────────────────────────────────────────
  const s3a = await prisma.scope3Record.create({
    data: {
      companyId: company.id,
      supplierId: alpha.id,
      categoryId: categoryIds["C1"],
      periodYear: 2024,
      valueTco2e: 125.00,
      calculationMethod: "spend_based",
      emissionFactorSource: PROXY_FACTOR_SOURCE,
      dataSource: "proxy",
      assumptions: PROXY_ASSUMPTIONS_SPEND,
      confidence: 0.5,
      activityDataJson: JSON.stringify({ spend_eur: 250000 }),
    },
  }).catch(() => null);

  const s3b = await prisma.scope3Record.create({
    data: {
      companyId: company.id,
      supplierId: beta.id,
      categoryId: categoryIds["C4"],
      periodYear: 2024,
      valueTco2e: 78.30,
      calculationMethod: "activity_based",
      emissionFactorSource: TRANSPORT_FACTOR_SOURCE,
      dataSource: "proxy",
      assumptions: PROXY_ASSUMPTIONS_TRANSPORT,
      confidence: 0.5,
      activityDataJson: JSON.stringify({ ton_km: 783000 }),
    },
  }).catch(() => null);

  const s3c = await prisma.scope3Record.create({
    data: {
      companyId: company.id,
      supplierId: null,
      categoryId: categoryIds["C1"],
      periodYear: 2024,
      valueTco2e: 55.00,
      calculationMethod: "spend_based",
      emissionFactorSource: PROXY_FACTOR_SOURCE,
      dataSource: "proxy",
      assumptions: PROXY_ASSUMPTIONS_SPEND,
      confidence: 0.5,
      activityDataJson: JSON.stringify({ spend_eur: 110000 }),
    },
  }).catch(() => null);

  // ── Methodology Notes ──────────────────────────────────────────────────────
  const noteData = [
    {
      scope: "scope_1" as const,
      text: "Scope 1 emissions calculated using DEFRA 2023 conversion factors for natural gas combustion and company-owned vehicle fuel consumption. Organisational boundary: operational control.",
    },
    {
      scope: "scope_2" as const,
      text: "Scope 2 emissions calculated using the location-based method. German national grid emission factor sourced from UBA (Umweltbundesamt) 2023 report.",
    },
    {
      scope: "scope_3" as const,
      text: "Scope 3 emissions estimated using spend-based and activity-based proxy factors from DEFRA 2023. All proxy values carry a confidence score of 0.5. Materiality assessed against GHG Protocol guidance; Categories C1 and C4 identified as material for this reporting entity.",
    },
  ];

  for (const note of noteData) {
    await prisma.methodologyNote.upsert({
      where: { companyId_scope: { companyId: company.id, scope: note.scope } },
      update: { text: note.text },
      create: { companyId: company.id, scope: note.scope, text: note.text },
    });
  }

  // ── Audit Events ───────────────────────────────────────────────────────────
  const auditItems = [
    { entityType: "supplier" as const, entityId: alpha.id },
    { entityType: "supplier" as const, entityId: beta.id },
    ...(s1a ? [{ entityType: "scope1" as const, entityId: s1a.id }] : []),
    ...(s1b ? [{ entityType: "scope1" as const, entityId: s1b.id }] : []),
    ...(s2a ? [{ entityType: "scope2" as const, entityId: s2a.id }] : []),
    ...(s3a ? [{ entityType: "scope3" as const, entityId: s3a.id }] : []),
    ...(s3b ? [{ entityType: "scope3" as const, entityId: s3b.id }] : []),
    ...(s3c ? [{ entityType: "scope3" as const, entityId: s3c.id }] : []),
  ];

  for (const item of auditItems) {
    await prisma.auditTrailEvent.create({
      data: {
        companyId: company.id,
        entityType: item.entityType,
        entityId: item.entityId,
        action: "created",
        actor: "system",
      },
    });
  }

  // Gamma supplier audit event (always exists)
  const gamma = await prisma.supplier.findUnique({ where: { publicFormToken: "seed-token-gamma" } });
  if (gamma) {
    await prisma.auditTrailEvent.create({
      data: {
        companyId: company.id,
        entityType: "supplier",
        entityId: gamma.id,
        action: "created",
        actor: "system",
      },
    }).catch(() => null);
  }

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
