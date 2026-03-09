import { prisma } from "./prisma";

/**
 * Creates an audit trail event for any significant data mutation.
 * This is an append-only log — audit events are never updated or deleted.
 */
export async function createAuditEvent(params: {
  companyId: string;
  entityType: string;
  entityId: string;
  action: string;
  actor: string;
  comment?: string;
}) {
  return prisma.auditTrailEvent.create({
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
