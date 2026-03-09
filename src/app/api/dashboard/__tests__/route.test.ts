import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

// Mock prisma BEFORE importing the route
vi.mock("@/lib/prisma", () => ({
  prisma: {
    company: {
      findUnique: vi.fn(),
    },
    scope1Record: {
      aggregate: vi.fn(),
    },
    scope2Record: {
      aggregate: vi.fn(),
    },
    scope3Record: {
      aggregate: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { GET } from "../route";

const mockPrisma = prisma as unknown as {
  company: { findUnique: ReturnType<typeof vi.fn> };
  scope1Record: { aggregate: ReturnType<typeof vi.fn> };
  scope2Record: { aggregate: ReturnType<typeof vi.fn> };
  scope3Record: { aggregate: ReturnType<typeof vi.fn> };
};

describe("GET /api/dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.company.findUnique.mockResolvedValue({
      id: "demo-company-001",
      name: "Test Company",
      reportingYear: 2024,
      country: "DE",
      orgBoundary: "operational_control",
    });
    mockPrisma.scope1Record.aggregate.mockResolvedValue({ _sum: { valueTco2e: 58.0 } });
    mockPrisma.scope2Record.aggregate.mockResolvedValue({ _sum: { valueTco2e: 38.5 } });
    mockPrisma.scope3Record.aggregate.mockResolvedValue({ _sum: { valueTco2e: 258.3 } });
  });

  it("TC-05: returns correct totals and grand total", async () => {
    const response = await GET();
    expect(response).toBeInstanceOf(NextResponse);
    const json = await response.json() as { scope1: number; scope2: number; scope3: number; total: number };
    expect(json.scope1).toBeCloseTo(58.0);
    expect(json.scope2).toBeCloseTo(38.5);
    expect(json.scope3).toBeCloseTo(258.3);
    expect(json.total).toBeCloseTo(354.8);
    expect(response.status).toBe(200);
  });
});
