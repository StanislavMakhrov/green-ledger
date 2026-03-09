import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    scope1Record: {
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

const mockPrisma = prisma as {
  scope1Record: {
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  auditTrailEvent: { create: ReturnType<typeof vi.fn> };
};

describe("GET /api/scope1", () => {
  beforeEach(() => vi.clearAllMocks());

  it("TC-13: returns list of scope 1 records", async () => {
    mockPrisma.scope1Record.findMany.mockResolvedValue([
      { id: "r1", periodYear: 2024, valueTco2e: 45.2, calculationMethod: "Natural gas" },
      { id: "r2", periodYear: 2024, valueTco2e: 12.8, calculationMethod: "Fleet" },
    ]);

    const res = await GET();
    const json = await res.json() as unknown[];
    expect(Array.isArray(json)).toBe(true);
    expect(json).toHaveLength(2);
    expect(res.status).toBe(200);
  });
});

describe("POST /api/scope1", () => {
  beforeEach(() => vi.clearAllMocks());

  it("TC-14: creates scope 1 record", async () => {
    const newRecord = {
      id: "r-new",
      companyId: "demo-company-001",
      periodYear: 2024,
      valueTco2e: 50.0,
      calculationMethod: "Natural gas",
      emissionFactorsSource: "DEFRA 2023",
      dataSource: "manual",
    };
    mockPrisma.scope1Record.create.mockResolvedValue(newRecord);
    mockPrisma.auditTrailEvent.create.mockResolvedValue({});

    const req = new NextRequest("http://localhost/api/scope1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        periodYear: 2024,
        valueTco2e: 50.0,
        calculationMethod: "Natural gas",
        emissionFactorsSource: "DEFRA 2023",
        dataSource: "manual",
      }),
    });

    const res = await POST(req);
    expect(mockPrisma.scope1Record.create).toHaveBeenCalled();
    expect(res.status).toBe(201);
    const json = await res.json() as typeof newRecord;
    expect(json.valueTco2e).toBe(50.0);
  });
});
