/**
 * GET  /api/scope-3/categories  — list all Scope 3 categories
 * POST /api/scope-3/categories  — update materiality for a category
 *
 * Related spec: docs/spec.md §"Scope3Category", §"Materiality"
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const categories = await prisma.scope3Category.findMany({
    orderBy: { code: 'asc' },
  })
  return NextResponse.json(categories)
}

export async function POST(request: Request) {
  const body = await request.json() as {
    id: string
    material: boolean
    materialityReason?: string
  }

  const category = await prisma.scope3Category.update({
    where: { id: body.id },
    data: {
      material: body.material,
      materialityReason: body.materialityReason ?? null,
    },
  })
  return NextResponse.json(category)
}
