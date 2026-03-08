/**
 * Audit trail helper — records AuditTrailEvent rows for every create/update/
 * submit/export action throughout the app.
 *
 * All API route handlers should call the appropriate helper before returning
 * a success response.
 *
 * Related spec: docs/spec.md §"AuditTrailEvent"
 */
import { prisma } from './prisma'

/** Valid entity types for the audit trail. */
export type AuditEntityType =
  | 'supplier'
  | 'scope1'
  | 'scope2'
  | 'scope3'
  | 'methodology'
  | 'export'

/** Valid actions for the audit trail. */
export type AuditAction = 'created' | 'updated' | 'submitted' | 'exported'

/**
 * Records a single audit trail event.
 *
 * @param companyId  - Company that owns the affected entity
 * @param entityType - Type of entity affected
 * @param entityId   - ID of the affected entity (or a synthetic key like "pdf")
 * @param action     - The action performed
 * @param actor      - Who performed the action: "user", "supplier", or "system"
 * @param comment    - Optional freetext note
 */
export async function recordAuditEvent(
  companyId: string,
  entityType: AuditEntityType,
  entityId: string,
  action: AuditAction,
  actor: 'user' | 'supplier' | 'system',
  comment?: string,
): Promise<void> {
  await prisma.auditTrailEvent.create({
    data: {
      companyId,
      entityType,
      entityId,
      action,
      actor,
      comment: comment ?? null,
    },
  })
}
