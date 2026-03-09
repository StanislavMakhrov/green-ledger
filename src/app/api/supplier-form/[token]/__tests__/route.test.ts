import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    supplier: {
      findUnique: vi.fn(),
    },
    company: {
      findUnique: vi.fn(),
    },
    scope3Category: {
      findFirst: vi.fn(),
    },
    scope3Record: {
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
  supplier: { findUnique: ReturnType<typeof vi.fn> };
  company: { findUnique: ReturnType<typeof vi.fn> };
  scope3Category: { findFirst: ReturnType<typeof vi.fn> };
  scope3Record: { create: ReturnType<typeof vi.fn> };
  auditTrailEvent: { create: ReturnType<typeof vi.fn> };
};

const activeSupplier = {
  id: "sup-1",
  name: "Alpha Supplier",
  sector: "Manufacturing",
  companyId: "demo-company-001",
  status: "active",
  publicFormToken: "valid-token",
};

describe("GET /api/supplier-form/[token]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("TC-29: with invalid token returns 404", async () => {
    mockPrisma.supplier.findUnique.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/supplier-form/bad-token");
    const res = await GET(req, { params: Promise.resolve({ token: "bad-token" }) });
    expect(res.status).toBe(404);
  });

  it("TC-31: with inactive supplier returns 404", async () => {
    mockPrisma.supplier.findUnique.mockResolvedValue({ ...activeSupplier, status: "inactive" });
    const req = new NextRequest("http://localhost/api/supplier-form/valid-token");
    const res = await GET(req, { params: Promise.resolve({ token: "valid-token" }) });
    expect(res.status).toBe(404);
  });
});

describe("POST /api/supplier-form/[token]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.supplier.findUnique.mockResolvedValue(activeSupplier);
    mockPrisma.company.findUnique.mockResolvedValue({ id: "demo-company-001", reportingYear: 2024 });
    mockPrisma.scope3Category.findFirst.mockResolvedValue({ id: "cat-c1", code: "C1" });
    mockPrisma.scope3Record.create.mockResolvedValue({
      id: "rec-1",
      valueTco2e: 0.5,
      calculationMethod: "spend_based",
      dataSource: "proxy",
      confidence: 0.5,
      assumptions: "Spend-based proxy applied.",
      activityDataJson: { spend_eur: 1000 },
    });
    mockPrisma.auditTrailEvent.create.mockResolvedValue({});
  });

  it("TC-27: with spend_eur creates scope3 record with correct proxy values", async () => {
    const req = new NextRequest("http://localhost/api/supplier-form/valid-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spend_eur: 1000 }),
    });
    const res = await POST(req, { params: Promise.resolve({ token: "valid-token" }) });

    expect(mockPrisma.scope3Record.create).toHaveBeenCalled();
    const createCall = mockPrisma.scope3Record.create.mock.calls[0] as [{ data: Record<string, unknown> }];
    const data = createCall[0].data;
    expect(data.valueTco2e).toBeCloseTo(0.5);
    expect(data.dataSource).toBe("proxy");
    expect(data.confidence).toBe(0.5);
    expect(data.assumptions).toBeTruthy();
    expect(res.status).toBe(201);
  });

  it("TC-28: with spend_eur=2000 stores correct valueTco2e and activityDataJson", async () => {
    mockPrisma.scope3Record.create.mockResolvedValue({
      id: "rec-2", valueTco2e: 1.0, calculationMethod: "spend_based",
      dataSource: "proxy", confidence: 0.5, assumptions: "...",
    });

    const req = new NextRequest("http://localhost/api/supplier-form/valid-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spend_eur: 2000 }),
    });
    const res = await POST(req, { params: Promise.resolve({ token: "valid-token" }) });

    expect(mockPrisma.scope3Record.create).toHaveBeenCalled();
    const createCall = mockPrisma.scope3Record.create.mock.calls[0] as [{ data: Record<string, unknown> }];
    const data = createCall[0].data;
    expect(data.valueTco2e).toBeCloseTo(1.0);
    expect(data.calculationMethod).toBe("spend_based");
    expect(data.activityDataJson).toEqual(JSON.stringify({ spend_eur: 2000 }));
    expect(res.status).toBe(201);
  });

  it("TC-30: with no activity fields returns 400 and does not create record", async () => {
    const req = new NextRequest("http://localhost/api/supplier-form/valid-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await POST(req, { params: Promise.resolve({ token: "valid-token" }) });

    expect(res.status).toBe(400);
    const json = await res.json() as { error: string };
    expect(json.error).toBeTruthy();
    expect(mockPrisma.scope3Record.create).not.toHaveBeenCalled();
  });
});
