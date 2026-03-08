import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the prisma module so audit.ts can be imported without a real DB
vi.mock("../prisma", () => ({
  prisma: {
    auditTrailEvent: {
      create: vi.fn().mockResolvedValue({ id: "test-id" }),
    },
  },
}));

describe("createAuditEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an audit event with correct fields", async () => {
    const { createAuditEvent } = await import("../audit");
    const { prisma } = await import("../prisma");

    const result = await createAuditEvent({
      companyId: "company-1",
      entityType: "scope1",
      entityId: "record-1",
      action: "created",
      actor: "user",
      comment: "manual entry",
    });

    expect(result).toEqual({ id: "test-id" });
    expect(prisma.auditTrailEvent.create).toHaveBeenCalledWith({
      data: {
        companyId: "company-1",
        entityType: "scope1",
        entityId: "record-1",
        action: "created",
        actor: "user",
        comment: "manual entry",
      },
    });
  });

  it("works without optional comment field", async () => {
    const { createAuditEvent } = await import("../audit");
    const { prisma } = await import("../prisma");
    await createAuditEvent({
      companyId: "company-1",
      entityType: "scope2",
      entityId: "record-2",
      action: "created",
      actor: "system",
    });
    expect(prisma.auditTrailEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actor: "system",
        comment: undefined,
      }),
    });
  });
});
