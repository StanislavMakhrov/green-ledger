/**
 * POST /api/public/supplier/[token]
 *
 * Accepts supplier-submitted activity data from the public form and creates a
 * Scope3Record (dataSource = "supplier_form"). This route is intentionally
 * unauthenticated — it is accessed via a tokenized URL.
 *
 * Accepted activity fields (at least one must be provided):
 *  - spend_eur   → spend-based proxy calculation
 *  - ton_km      → transport activity-based calculation
 *  - waste_kg    → waste activity-based calculation
 *
 * Related spec: docs/spec.md §"Supplier Public Form"
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { recordAuditEvent } from '@/lib/audit'
import {
  calcTco2eFromSpend,
  calcTco2eFromTonKm,
  calcTco2eFromWaste,
  PROXY_CONFIDENCE,
  SUPPLIER_FORM_CONFIDENCE,
} from '@/lib/calculations'

interface RouteParams {
  params: { token: string }
}

export async function POST(request: Request, { params }: RouteParams) {
  const supplier = await prisma.supplier.findUnique({
    where: { publicFormToken: params.token },
  })
  if (!supplier) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
  }

  const body = await request.json() as {
    spend_eur?: number
    ton_km?: number
    waste_kg?: number
    notes?: string
  }

  // Determine calculation method and tCO₂e value
  let valueTco2e = 0
  let calculationMethod = 'spend_based'
  let emissionFactorSource = 'PROXY_FACTOR placeholder (see lib/calculations.ts)'
  let confidence = PROXY_CONFIDENCE
  let dataSource = 'proxy'

  if (body.ton_km && body.ton_km > 0) {
    valueTco2e = calcTco2eFromTonKm(body.ton_km)
    calculationMethod = 'activity_based'
    emissionFactorSource = 'EcoTransIT 2024 — truck DE (placeholder)'
    confidence = SUPPLIER_FORM_CONFIDENCE
    dataSource = 'supplier_form'
  } else if (body.waste_kg && body.waste_kg > 0) {
    valueTco2e = calcTco2eFromWaste(body.waste_kg)
    calculationMethod = 'activity_based'
    emissionFactorSource = 'DEFRA 2024 — mixed commercial waste (placeholder)'
    confidence = SUPPLIER_FORM_CONFIDENCE
    dataSource = 'supplier_form'
  } else if (body.spend_eur && body.spend_eur > 0) {
    valueTco2e = calcTco2eFromSpend(body.spend_eur)
    calculationMethod = 'spend_based'
    emissionFactorSource = 'EXIOBASE 3.8 average (PROXY_FACTOR placeholder)'
    confidence = PROXY_CONFIDENCE
    dataSource = 'supplier_form'
  } else {
    return NextResponse.json(
      { error: 'At least one of spend_eur, ton_km, or waste_kg must be provided' },
      { status: 400 },
    )
  }

  // Find the default material category (C1 — Purchased goods and services)
  const defaultCategory = await prisma.scope3Category.findUnique({ where: { code: 'C1' } })
  if (!defaultCategory) {
    return NextResponse.json({ error: 'Default Scope 3 category not found' }, { status: 500 })
  }

  const company = await prisma.company.findFirst()
  if (!company) {
    return NextResponse.json({ error: 'No company found' }, { status: 500 })
  }

  const assumptions = body.notes
    ? `Supplier notes: ${body.notes}. Auto-calculated from submitted activity data.`
    : 'Auto-calculated from supplier-submitted activity data.'

  const record = await prisma.scope3Record.create({
    data: {
      companyId: company.id,
      supplierId: supplier.id,
      categoryId: defaultCategory.id,
      periodYear: company.reportingYear,
      valueTco2e,
      calculationMethod,
      emissionFactorSource,
      dataSource,
      assumptions,
      confidence,
      activityDataJson: JSON.stringify(body),
    },
  })

  await recordAuditEvent(
    company.id,
    'scope3',
    record.id,
    'submitted',
    'supplier',
    `Supplier ${supplier.name} submitted activity data via public form`,
  )

  return NextResponse.json({ success: true, recordId: record.id, valueTco2e }, { status: 201 })
}
