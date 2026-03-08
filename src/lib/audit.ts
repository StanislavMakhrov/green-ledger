import { prisma } from "./prisma";

interface CreateAuditEventParams {
  companyId: string;
  entityType: string;
  entityId: string;
  action: string;
  actor: string;
  comment?: string;
}

/**
 * Creates an AuditTrailEvent record in the database.
 * Call this whenever a significant mutation occurs (create, update, delete, export).
 */
export async function createAuditEvent(
  params: CreateAuditEventParams,
): Promise<void> {
  await prisma.auditTrailEvent.create({
    data: {
      companyId: params.companyId,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      actor: params.actor,
      comment: params.comment,
    },
  });
}
