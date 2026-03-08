/**
 * GET  /api/scope-2  — list Scope 2 records for the demo company
 * POST /api/scope-2  — create a new Scope 2 record
 *
 * Related spec: docs/spec.md §"Scope2Record"
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { recordAuditEvent } from '@/lib/audit'

export async function GET() {
  const company = await prisma.company.findFirst()
  if (!company) return NextResponse.json({ error: 'No company found' }, { status: 404 })

  const records = await prisma.scope2Record.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(records)
}

export async function POST(request: Request) {
  const company = await prisma.company.findFirst()
  if (!company) return NextResponse.json({ error: 'No company found' }, { status: 404 })

  const body = await request.json() as {
    periodYear: number
    valueTco2e: number
    calculationMethod: string
    emissionFactorsSource: string
    dataSource: string
    assumptions?: string
  }

  const record = await prisma.scope2Record.create({
    data: {
      companyId: company.id,
      periodYear: body.periodYear,
      valueTco2e: body.valueTco2e,
      calculationMethod: body.calculationMethod,
      emissionFactorsSource: body.emissionFactorsSource,
      dataSource: body.dataSource,
      assumptions: body.assumptions ?? null,
    },
  })

  await recordAuditEvent(company.id, 'scope2', record.id, 'created', 'user')

  return NextResponse.json(record, { status: 201 })
}
