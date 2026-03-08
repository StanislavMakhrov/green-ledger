/**
 * GET /api/audit-trail
 *
 * Returns all audit trail events for the demo company, newest first.
 *
 * Related spec: docs/spec.md §"AuditTrailEvent"
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const company = await prisma.company.findFirst()
  if (!company) return NextResponse.json({ error: 'No company found' }, { status: 404 })

  const events = await prisma.auditTrailEvent.findMany({
    where: { companyId: company.id },
    orderBy: { timestamp: 'desc' },
    take: 100,
  })
  return NextResponse.json(events)
}
