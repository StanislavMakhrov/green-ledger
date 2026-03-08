/**
 * GET /api/methodology  — get all methodology notes for the demo company
 * PUT /api/methodology  — upsert a methodology note for a specific scope
 *
 * Related spec: docs/spec.md §"MethodologyNote"
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { recordAuditEvent } from '@/lib/audit'
import { randomUUID } from 'crypto'

export async function GET() {
  const company = await prisma.company.findFirst()
  if (!company) return NextResponse.json({ error: 'No company found' }, { status: 404 })

  const notes = await prisma.methodologyNote.findMany({
    where: { companyId: company.id },
    orderBy: { scope: 'asc' },
  })
  return NextResponse.json(notes)
}

export async function PUT(request: Request) {
  const company = await prisma.company.findFirst()
  if (!company) return NextResponse.json({ error: 'No company found' }, { status: 404 })

  const body = await request.json() as { scope: string; text: string }

  const note = await prisma.methodologyNote.upsert({
    where: { companyId_scope: { companyId: company.id, scope: body.scope } },
    update: { text: body.text },
    create: {
      id: randomUUID(),
      companyId: company.id,
      scope: body.scope,
      text: body.text,
    },
  })

  await recordAuditEvent(company.id, 'methodology', note.id, 'updated', 'user')

  return NextResponse.json(note)
}
