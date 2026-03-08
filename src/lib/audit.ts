import { prisma } from "./prisma";

/**
 * Helper to create an AuditTrailEvent record.
 * All API routes should call this after mutating data.
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
