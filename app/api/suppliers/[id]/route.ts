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
  params: { id: string }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const body = await request.json() as {
    name?: string
    country?: string
    sector?: string
    contactEmail?: string
    status?: string
  }

  const supplier = await prisma.supplier.update({
    where: { id: params.id },
    data: body,
  })

  const company = await prisma.company.findFirst()
  if (company) {
    await recordAuditEvent(company.id, 'supplier', supplier.id, 'updated', 'user')
  }

  return NextResponse.json(supplier)
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  await prisma.supplier.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
