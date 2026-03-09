import { prisma } from "@/lib/prisma";
import type { AuditEntityType, AuditAction } from "@/app/generated/prisma/client";

/**
 * Log an audit trail event for the given entity.
 * Writes to the AuditTrailEvent table with a generated UUID.
 */
export async function logAuditEvent(params: {
  companyId: string;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  actor: string;
  comment?: string;
}): Promise<void> {
  await prisma.auditTrailEvent.create({
    data: {
      id: crypto.randomUUID(),
      ...params,
      timestamp: new Date(),
    },
  });
}
