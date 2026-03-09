import { PrismaClient, AuditEntityType, AuditAction } from "@prisma/client";
import { DEMO_COMPANY_ID } from "./constants";

// ─────────────────────────────────────────────────────────────────────────────
// Audit Trail Helper
// ─────────────────────────────────────────────────────────────────────────────

/** Parameters for creating an audit trail event. */
export interface CreateAuditEventParams {
  companyId?: string;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  actor: string;
  comment?: string;
}

/**
 * Creates a single AuditTrailEvent record in the database.
 * Called from all API route handlers that perform write operations.
 *
 * @param prisma - The Prisma client instance
 * @param params - Audit event parameters
 * @returns The created AuditTrailEvent record
 */
export async function createAuditEvent(
  prisma: PrismaClient,
  params: CreateAuditEventParams
) {
  return prisma.auditTrailEvent.create({
    data: {
      companyId: params.companyId ?? DEMO_COMPANY_ID,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      actor: params.actor,
      comment: params.comment,
    },
  });
}
