import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma client
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
import { GET } from "@/app/api/dashboard/route";

const mockCompany = {
  id: "demo-company-001",
  name: "Demo GmbH",
  country: "DE",
  reportingYear: 2024,
  orgBoundary: "operational_control",
};

const mockAgg = (value: number | null) => ({
  _sum: { valueTco2e: value },
});

beforeEach(() => {
  vi.clearAllMocks();
});

// TC-01: Dashboard returns correct scope totals
describe("GET /api/dashboard", () => {
  it("TC-01: returns scope totals with correct values", async () => {
    vi.mocked(prisma.company.findUnique).mockResolvedValue(mockCompany as never);
    vi.mocked(prisma.scope1Record.aggregate).mockResolvedValue(mockAgg(45.2) as never);
    vi.mocked(prisma.scope2Record.aggregate).mockResolvedValue(mockAgg(38.5) as never);
    vi.mocked(prisma.scope3Record.aggregate).mockResolvedValue(mockAgg(256.8) as never);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.scope1).toBe(45.2);
    expect(data.scope2).toBe(38.5);
    expect(data.scope3).toBe(256.8);
    expect(data.reportingYear).toBe(2024);
  });

  // TC-02: total equals sum of scope values
  it("TC-02: total equals scope1 + scope2 + scope3", async () => {
    vi.mocked(prisma.company.findUnique).mockResolvedValue(mockCompany as never);
    vi.mocked(prisma.scope1Record.aggregate).mockResolvedValue(mockAgg(10) as never);
    vi.mocked(prisma.scope2Record.aggregate).mockResolvedValue(mockAgg(20) as never);
    vi.mocked(prisma.scope3Record.aggregate).mockResolvedValue(mockAgg(30) as never);

    const response = await GET();
    const data = await response.json();

    expect(data.total).toBe(60);
    expect(data.total).toBe(data.scope1 + data.scope2 + data.scope3);
  });

  // TC-03: reportingYear comes from Company.reportingYear
  it("TC-03: includes reportingYear from company", async () => {
    vi.mocked(prisma.company.findUnique).mockResolvedValue({
      ...mockCompany,
      reportingYear: 2023,
    } as never);
    vi.mocked(prisma.scope1Record.aggregate).mockResolvedValue(mockAgg(0) as never);
    vi.mocked(prisma.scope2Record.aggregate).mockResolvedValue(mockAgg(0) as never);
    vi.mocked(prisma.scope3Record.aggregate).mockResolvedValue(mockAgg(0) as never);

    const response = await GET();
    const data = await response.json();

    expect(data.reportingYear).toBe(2023);
  });

  // TC-04: Returns zero values when no records exist
  it("TC-04: returns zero values when aggregates return null", async () => {
    vi.mocked(prisma.company.findUnique).mockResolvedValue(mockCompany as never);
    vi.mocked(prisma.scope1Record.aggregate).mockResolvedValue(mockAgg(null) as never);
    vi.mocked(prisma.scope2Record.aggregate).mockResolvedValue(mockAgg(null) as never);
    vi.mocked(prisma.scope3Record.aggregate).mockResolvedValue(mockAgg(null) as never);

    const response = await GET();
    const data = await response.json();

    expect(data.scope1).toBe(0);
    expect(data.scope2).toBe(0);
    expect(data.scope3).toBe(0);
    expect(data.total).toBe(0);
  });

  it("returns 404 when company not found", async () => {
    vi.mocked(prisma.company.findUnique).mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(404);
  });

  it("returns 500 on database error", async () => {
    vi.mocked(prisma.company.findUnique).mockRejectedValue(
      new Error("DB error")
    );

    const response = await GET();

    expect(response.status).toBe(500);
  });
});
