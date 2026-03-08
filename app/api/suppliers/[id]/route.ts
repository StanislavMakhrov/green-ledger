/**
 * PUT    /api/suppliers/[id]  — update a supplier
 * DELETE /api/suppliers/[id]  — delete a supplier
 *
 * Related spec: docs/spec.md §"Supplier"
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { recordAuditEvent } from '@/lib/audit'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params
  const body = await request.json() as {
    name?: string
    country?: string
    sector?: string
    contactEmail?: string
    status?: string
  }

  const supplier = await prisma.supplier.update({
    where: { id },
    data: body,
  })

  const company = await prisma.company.findFirst()
  if (company) {
    await recordAuditEvent(company.id, 'supplier', supplier.id, 'updated', 'user')
  }

  return NextResponse.json(supplier)
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params
  await prisma.supplier.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
