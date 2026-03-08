/**
 * GET  /api/suppliers   — list all suppliers for the demo company
 * POST /api/suppliers   — create a new supplier
 *
 * Related spec: docs/spec.md §"Supplier"
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { recordAuditEvent } from '@/lib/audit'
import { randomUUID } from 'crypto'

export async function GET() {
  const company = await prisma.company.findFirst()
  if (!company) return NextResponse.json({ error: 'No company found' }, { status: 404 })

  const suppliers = await prisma.supplier.findMany({
    where: { companyId: company.id },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(suppliers)
}

export async function POST(request: Request) {
  const company = await prisma.company.findFirst()
  if (!company) return NextResponse.json({ error: 'No company found' }, { status: 404 })

  const body = await request.json() as {
    name: string
    country: string
    sector: string
    contactEmail: string
  }

  const supplier = await prisma.supplier.create({
    data: {
      companyId: company.id,
      name: body.name,
      country: body.country,
      sector: body.sector,
      contactEmail: body.contactEmail,
      publicFormToken: randomUUID(),
      status: 'active',
    },
  })

  await recordAuditEvent(company.id, 'supplier', supplier.id, 'created', 'user')

  return NextResponse.json(supplier, { status: 201 })
}
