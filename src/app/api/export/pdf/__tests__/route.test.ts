import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    company: { findUnique: vi.fn() },
    scope1Record: { findMany: vi.fn() },
    scope2Record: { findMany: vi.fn() },
    scope3Record: { findMany: vi.fn() },
    scope3Category: { findMany: vi.fn() },
    methodologyNote: { findMany: vi.fn() },
    auditTrailEvent: { create: vi.fn() },
  },
}));

vi.mock("@/lib/pdf", () => ({
  generateReport: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { generateReport } from "@/lib/pdf";
import { GET } from "../route";

const mockPrisma = prisma as unknown as {
  company: { findUnique: ReturnType<typeof vi.fn> };
  scope1Record: { findMany: ReturnType<typeof vi.fn> };
  scope2Record: { findMany: ReturnType<typeof vi.fn> };
  scope3Record: { findMany: ReturnType<typeof vi.fn> };
  scope3Category: { findMany: ReturnType<typeof vi.fn> };
  methodologyNote: { findMany: ReturnType<typeof vi.fn> };
  auditTrailEvent: { create: ReturnType<typeof vi.fn> };
};

const mockGenerateReport = generateReport as ReturnType<typeof vi.fn>;

describe("GET /api/export/pdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.company.findUnique.mockResolvedValue({
      id: "demo-company-001", name: "Test GmbH", reportingYear: 2024,
      country: "DE", orgBoundary: "operational_control",
    });
    mockPrisma.scope1Record.findMany.mockResolvedValue([]);
    mockPrisma.scope2Record.findMany.mockResolvedValue([]);
    mockPrisma.scope3Record.findMany.mockResolvedValue([]);
    mockPrisma.scope3Category.findMany.mockResolvedValue([]);
    mockPrisma.methodologyNote.findMany.mockResolvedValue([]);
    mockPrisma.auditTrailEvent.create.mockResolvedValue({});
    mockGenerateReport.mockResolvedValue(Buffer.from("fake-pdf-content"));
  });

  it("TC-32: returns PDF response with correct headers", async () => {
    const res = await GET();

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    const disposition = res.headers.get("Content-Disposition") ?? "";
    expect(disposition.startsWith("attachment; filename=")).toBe(true);

    const buffer = await res.arrayBuffer();
    expect(buffer.byteLength).toBeGreaterThan(0);
  });
});
