import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    scope2Record: {
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
  scope2Record: {
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  auditTrailEvent: { create: ReturnType<typeof vi.fn> };
};

describe("GET /api/scope2", () => {
  beforeEach(() => vi.clearAllMocks());

  it("TC-15: returns list of scope 2 records", async () => {
    mockPrisma.scope2Record.findMany.mockResolvedValue([
      { id: "r1", periodYear: 2024, valueTco2e: 38.5, calculationMethod: "Location-based" },
    ]);

    const res = await GET();
    const json = await res.json() as unknown[];
    expect(Array.isArray(json)).toBe(true);
    expect(json).toHaveLength(1);
    expect(res.status).toBe(200);
  });
});

describe("POST /api/scope2", () => {
  beforeEach(() => vi.clearAllMocks());

  it("TC-16: creates scope 2 record", async () => {
    mockPrisma.scope2Record.create.mockResolvedValue({
      id: "r-new",
      periodYear: 2024,
      valueTco2e: 40.0,
      calculationMethod: "Location-based",
      emissionFactorsSource: "UBA 2023",
      dataSource: "manual",
    });
    mockPrisma.auditTrailEvent.create.mockResolvedValue({});

    const req = new NextRequest("http://localhost/api/scope2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        periodYear: 2024,
        valueTco2e: 40.0,
        calculationMethod: "Location-based",
        emissionFactorsSource: "UBA 2023",
      }),
    });

    const res = await POST(req);
    expect(mockPrisma.scope2Record.create).toHaveBeenCalled();
    expect(res.status).toBe(201);
  });
});
