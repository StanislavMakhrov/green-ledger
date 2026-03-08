/**
 * POST /api/suppliers/[id]/token
 *
 * Regenerates the publicFormToken for a supplier, invalidating the previous
 * public form link.
 *
 * Related spec: docs/spec.md §"Supplier"
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(_request: Request, { params }: RouteParams) {
  const { id } = await params
  const supplier = await prisma.supplier.update({
    where: { id },
    data: { publicFormToken: randomUUID() },
  })
  return NextResponse.json({ publicFormToken: supplier.publicFormToken })
}
