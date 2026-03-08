/**
 * GET  /api/scope-3  — list Scope 3 records with category + supplier joins
 * POST /api/scope-3  — create a new Scope 3 record
 *
 * Related spec: docs/spec.md §"Scope3Record"
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { recordAuditEvent } from '@/lib/audit'

export async function GET() {
  const company = await prisma.company.findFirst()
  if (!company) return NextResponse.json({ error: 'No company found' }, { status: 404 })

  const records = await prisma.scope3Record.findMany({
    where: { companyId: company.id },
    include: {
      category: true,
      supplier: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(records)
}

export async function POST(request: Request) {
  const company = await prisma.company.findFirst()
  if (!company) return NextResponse.json({ error: 'No company found' }, { status: 404 })

  const body = await request.json() as {
    supplierId?: string
    categoryId: string
    periodYear: number
    valueTco2e: number
    calculationMethod: string
    emissionFactorSource: string
    dataSource: string
    assumptions?: string
    confidence?: number
    activityDataJson?: string
  }

  const record = await prisma.scope3Record.create({
    data: {
      companyId: company.id,
      supplierId: body.supplierId ?? null,
      categoryId: body.categoryId,
      periodYear: body.periodYear,
      valueTco2e: body.valueTco2e,
      calculationMethod: body.calculationMethod,
      emissionFactorSource: body.emissionFactorSource,
      dataSource: body.dataSource,
      assumptions: body.assumptions ?? null,
      confidence: body.confidence ?? 1.0,
      activityDataJson: body.activityDataJson ?? null,
    },
    include: { category: true, supplier: { select: { id: true, name: true } } },
  })

  await recordAuditEvent(company.id, 'scope3', record.id, 'created', 'user')

  return NextResponse.json(record, { status: 201 })
}
