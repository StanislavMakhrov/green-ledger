import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    scope3Record: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    auditTrailEvent: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { GET, POST } from "../route";
import { NextRequest } from "next/server";

const mockPrisma = prisma as unknown as {
  scope3Record: {
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  auditTrailEvent: { create: ReturnType<typeof vi.fn> };
};

describe("GET /api/scope3/records", () => {
  beforeEach(() => vi.clearAllMocks());

  it("TC-19: returns list of scope 3 records", async () => {
    mockPrisma.scope3Record.findMany.mockResolvedValue([
      { id: "r1", valueTco2e: 125.0, categoryId: "c1", confidence: 0.5, category: { code: "C1" }, supplier: null },
      { id: "r2", valueTco2e: 78.3, categoryId: "c4", confidence: 0.5, category: { code: "C4" }, supplier: null },
      { id: "r3", valueTco2e: 55.0, categoryId: "c1", confidence: 0.5, category: { code: "C1" }, supplier: null },
    ]);

    const res = await GET();
    const json = await res.json() as unknown[];
    expect(Array.isArray(json)).toBe(true);
    expect(json).toHaveLength(3);
    expect(res.status).toBe(200);
  });
});

describe("POST /api/scope3/records", () => {
  beforeEach(() => vi.clearAllMocks());

  it("TC-20: creates scope 3 record", async () => {
    mockPrisma.scope3Record.create.mockResolvedValue({
      id: "r-new",
      companyId: "demo-company-001",
      categoryId: "cat-1",
      periodYear: 2024,
      valueTco2e: 100.0,
      calculationMethod: "spend_based",
      emissionFactorSource: "DEFRA 2023",
      dataSource: "proxy",
      confidence: 0.5,
    });
    mockPrisma.auditTrailEvent.create.mockResolvedValue({});

    const req = new NextRequest("http://localhost/api/scope3/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId: "cat-1",
        periodYear: 2024,
        valueTco2e: 100.0,
        calculationMethod: "spend_based",
        emissionFactorSource: "DEFRA 2023",
        dataSource: "proxy",
        confidence: 0.5,
      }),
    });

    const res = await POST(req);
    expect(mockPrisma.scope3Record.create).toHaveBeenCalled();
    expect(res.status).toBe(201);
  });
});
