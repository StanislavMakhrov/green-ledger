/**
 * Prisma seed script — populates a fresh SQLite database with demo data
 * for the GreenLedger MVP demo flow.
 *
 * Run with: npm run db:seed
 */
import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ── Company ───────────────────────────────────────────────────────────────
  const company = await prisma.company.upsert({
    where: { id: 'demo-company-id' },
    update: {},
    create: {
      id: 'demo-company-id',
      name: 'Mustermann GmbH',
      country: 'DE',
      reportingYear: 2024,
      orgBoundary: 'operational_control',
    },
  })
  console.log(`✓ Company: ${company.name}`)

  // ── Scope 3 Categories (GHG Protocol C1–C15) ─────────────────────────────
  const categories = [
    { code: 'C1', name: 'Purchased goods and services', material: true, materialityReason: 'Largest spend category; significant embedded emissions' },
    { code: 'C2', name: 'Capital goods', material: false },
    { code: 'C3', name: 'Fuel- and energy-related activities', material: false },
    { code: 'C4', name: 'Upstream transportation and distribution', material: true, materialityReason: 'High freight volume to EU customers' },
    { code: 'C5', name: 'Waste generated in operations', material: false },
    { code: 'C6', name: 'Business travel', material: false },
    { code: 'C7', name: 'Employee commuting', material: false },
    { code: 'C8', name: 'Upstream leased assets', material: false },
    { code: 'C9', name: 'Downstream transportation and distribution', material: false },
    { code: 'C10', name: 'Processing of sold products', material: false },
    { code: 'C11', name: 'Use of sold products', material: false },
    { code: 'C12', name: 'End-of-life treatment of sold products', material: false },
    { code: 'C13', name: 'Downstream leased assets', material: false },
    { code: 'C14', name: 'Franchises', material: false },
    { code: 'C15', name: 'Investments', material: false },
  ]

  const createdCategories: Record<string, string> = {}
  for (const cat of categories) {
    const created = await prisma.scope3Category.upsert({
      where: { code: cat.code },
      update: { material: cat.material, materialityReason: cat.materialityReason ?? null },
      create: {
        id: randomUUID(),
        code: cat.code,
        name: cat.name,
        material: cat.material,
        materialityReason: cat.materialityReason ?? null,
      },
    })
    createdCategories[cat.code] = created.id
  }
  console.log(`✓ ${categories.length} Scope 3 categories`)

  // ── Suppliers ─────────────────────────────────────────────────────────────
  const suppliers = [
    {
      id: 'supplier-001',
      name: 'Stahl & Co. KG',
      country: 'DE',
      sector: 'Manufacturing',
      contactEmail: 'esg@stahl-co.de',
      publicFormToken: 'token-stahl-001',
    },
    {
      id: 'supplier-002',
      name: 'LogiTrans GmbH',
      country: 'DE',
      sector: 'Logistics',
      contactEmail: 'sustainability@logitrans.de',
      publicFormToken: 'token-logitrans-002',
    },
    {
      id: 'supplier-003',
      name: 'GreenPack AG',
      country: 'CH',
      sector: 'Packaging',
      contactEmail: 'climate@greenpack.ch',
      publicFormToken: 'token-greenpack-003',
    },
  ]

  for (const s of suppliers) {
    await prisma.supplier.upsert({
      where: { id: s.id },
      update: {},
      create: { ...s, companyId: company.id, status: 'active' },
    })
  }
  console.log(`✓ ${suppliers.length} suppliers`)

  // ── Scope 1 Records ────────────────────────────────────────────────────────
  await prisma.scope1Record.upsert({
    where: { id: 'scope1-demo-001' },
    update: {},
    create: {
      id: 'scope1-demo-001',
      companyId: company.id,
      periodYear: 2024,
      valueTco2e: 45.2,
      calculationMethod: 'Direct measurement (gas meter)',
      emissionFactorsSource: 'DEFRA 2024',
      dataSource: 'manual',
      assumptions: 'Natural gas for heating; boiler efficiency assumed 92%',
    },
  })
  console.log('✓ 1 Scope 1 record')

  // ── Scope 2 Records ────────────────────────────────────────────────────────
  await prisma.scope2Record.upsert({
    where: { id: 'scope2-demo-001' },
    update: {},
    create: {
      id: 'scope2-demo-001',
      companyId: company.id,
      periodYear: 2024,
      valueTco2e: 28.7,
      calculationMethod: 'Location-based (grid average)',
      emissionFactorsSource: 'UBA Strommix 2024',
      dataSource: 'manual',
      assumptions: 'Full-year electricity consumption from utility bills',
    },
  })
  console.log('✓ 1 Scope 2 record')

  // ── Scope 3 Records ───────────────────────────────────────────────────────
  const scope3Records = [
    {
      id: 'scope3-demo-001',
      supplierId: 'supplier-001',
      categoryId: createdCategories['C1'],
      valueTco2e: 312.5,
      calculationMethod: 'spend_based',
      emissionFactorSource: 'EXIOBASE 3.8 — Manufacturing sector',
      dataSource: 'proxy',
      assumptions: 'Spend-based proxy using EXIOBASE manufacturing EF. Awaiting supplier-specific data.',
      confidence: 0.5,
      activityDataJson: JSON.stringify({ spend_eur: 1340000 }),
    },
    {
      id: 'scope3-demo-002',
      supplierId: 'supplier-002',
      categoryId: createdCategories['C4'],
      valueTco2e: 18.3,
      calculationMethod: 'activity_based',
      emissionFactorSource: 'EcoTransIT 2024 — truck DE',
      dataSource: 'supplier_form',
      assumptions: null,
      confidence: 0.85,
      activityDataJson: JSON.stringify({ ton_km: 52400 }),
    },
    {
      id: 'scope3-demo-003',
      supplierId: 'supplier-003',
      categoryId: createdCategories['C1'],
      valueTco2e: 7.8,
      calculationMethod: 'spend_based',
      emissionFactorSource: 'ECOINVENT 3.9 — Paper and packaging',
      dataSource: 'proxy',
      assumptions: 'Spend-based proxy; packaging supplier has not yet responded to data request.',
      confidence: 0.4,
      activityDataJson: JSON.stringify({ spend_eur: 33500 }),
    },
  ]

  for (const r of scope3Records) {
    await prisma.scope3Record.upsert({
      where: { id: r.id },
      update: {},
      create: {
        ...r,
        companyId: company.id,
        periodYear: 2024,
      },
    })
  }
  console.log(`✓ ${scope3Records.length} Scope 3 records`)

  // ── Methodology Notes ─────────────────────────────────────────────────────
  const notes = [
    {
      scope: 'scope_1',
      text: 'Scope 1 emissions cover direct combustion of natural gas for space heating at our main facility in Hamburg. Consumption data sourced from monthly utility invoices. Emission factors from DEFRA 2024 UK Government GHG Conversion Factors.',
    },
    {
      scope: 'scope_2',
      text: 'Scope 2 emissions calculated using the location-based method (German grid average). Electricity consumption from utility bills. Emission factor: UBA 2024 national grid average (0.364 kgCO₂e/kWh).',
    },
    {
      scope: 'scope_3',
      text: 'Scope 3 calculated for material categories using a combination of supplier-provided data (activity-based) and spend-based proxy estimates where supplier data is unavailable. Proxy emission factors from EXIOBASE 3.8 and ECOINVENT 3.9. Confidence scores reflect data quality (1.0 = primary data, <1.0 = proxy/estimate).',
    },
  ]

  for (const note of notes) {
    await prisma.methodologyNote.upsert({
      where: { companyId_scope: { companyId: company.id, scope: note.scope } },
      update: { text: note.text },
      create: {
        id: randomUUID(),
        companyId: company.id,
        scope: note.scope,
        text: note.text,
      },
    })
  }
  console.log('✓ 3 methodology notes')

  // ── Audit Trail ───────────────────────────────────────────────────────────
  await prisma.auditTrailEvent.create({
    data: {
      id: randomUUID(),
      companyId: company.id,
      entityType: 'scope3',
      entityId: 'scope3-demo-002',
      action: 'submitted',
      actor: 'supplier',
      comment: 'Supplier LogiTrans GmbH submitted activity data via public form',
    },
  })
  console.log('✓ 1 audit trail event')

  console.log('\n🎉 Seed complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
