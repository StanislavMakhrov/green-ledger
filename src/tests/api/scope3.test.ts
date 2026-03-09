import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    scope3Category: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    scope3Record: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
    supplier: {
      findUnique: vi.fn(),
    },
    company: {
      findUniqueOrThrow: vi.fn(),
    },
    auditTrailEvent: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { GET as getCategories } from "@/app/api/scope3/categories/route";
import { GET as getRecords, POST as postRecord } from "@/app/api/scope3/records/route";
import {
  GET as publicGet,
  POST as publicPost,
} from "@/app/api/public/supplier/[token]/route";

const mockCategory = {
  id: "cat-001",
  code: "C1",
  name: "Purchased goods & services",
  material: true,
  materialityReason: "High spend",
};

const mockSupplier = {
  id: "sup-001",
  companyId: "demo-company-001",
  name: "Acme GmbH",
  country: "DE",
  sector: "Logistics",
  contactEmail: "contact@acme.de",
  publicFormToken: "test-token-001",
  status: "active",
};

const mockRecord = {
  id: "rec-001",
  companyId: "demo-company-001",
  supplierId: "sup-001",
  categoryId: "cat-001",
  periodYear: 2024,
  valueTco2e: 233.0,
  calculationMethod: "spend_based",
  emissionFactorSource: "DEFRA 2023",
  dataSource: "supplier_form",
  assumptions:
    "Spend-based proxy estimate using DEFRA 2023 factor: 0.233 tCO₂e/EUR.",
  confidence: 0.4,
  activityDataJson: JSON.stringify({ spend_eur: 1000 }),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  supplier: mockSupplier,
  category: mockCategory,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.auditTrailEvent.create).mockResolvedValue({} as never);
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-17: Scope 3 categories list
// ─────────────────────────────────────────────────────────────────────────────

describe("GET /api/scope3/categories", () => {
  it("TC-17: returns list of categories", async () => {
    vi.mocked(prisma.scope3Category.findMany).mockResolvedValue(
      Array(15)
        .fill(null)
        .map((_, i) => ({
          ...mockCategory,
          id: `cat-${i + 1}`,
          code: `C${i + 1}`,
        })) as never
    );

    const response = await getCategories();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(15);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-19, TC-20: Scope 3 record creation
// ─────────────────────────────────────────────────────────────────────────────

describe("POST /api/scope3/records", () => {
  it("TC-19: creates a Scope 3 record with all required fields", async () => {
    vi.mocked(prisma.scope3Record.create).mockResolvedValue(mockRecord as never);

    const request = new Request("http://localhost/api/scope3/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId: "cat-001",
        supplierId: "sup-001",
        periodYear: 2024,
        valueTco2e: 233.0,
        calculationMethod: "spend_based",
        emissionFactorSource: "DEFRA 2023",
        dataSource: "supplier_form",
        confidence: 0.4,
      }),
    });

    const response = await postRecord(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.valueTco2e).toBe(233.0);
    expect(data.confidence).toBe(0.4);
  });

  it("TC-20: returns 400 when required fields missing", async () => {
    const request = new Request("http://localhost/api/scope3/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        periodYear: 2024,
        valueTco2e: 100,
        // missing categoryId, calculationMethod, etc.
      }),
    });

    const response = await postRecord(request);

    expect(response.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-22, TC-23: Public supplier form
// ─────────────────────────────────────────────────────────────────────────────

describe("GET /api/public/supplier/[token]", () => {
  it("TC-22: valid token returns supplier info and categories", async () => {
    vi.mocked(prisma.supplier.findUnique).mockResolvedValue(
      mockSupplier as never
    );
    vi.mocked(prisma.scope3Category.findMany).mockResolvedValue(
      [mockCategory] as never
    );

    const response = await publicGet(
      new Request("http://localhost/api/public/supplier/test-token-001"),
      { params: Promise.resolve({ token: "test-token-001" }) }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.supplierName).toBe("Acme GmbH");
    expect(Array.isArray(data.categories)).toBe(true);
  });

  it("TC-23: invalid token returns 404", async () => {
    vi.mocked(prisma.supplier.findUnique).mockResolvedValue(null);

    const response = await publicGet(
      new Request("http://localhost/api/public/supplier/invalid-token"),
      { params: Promise.resolve({ token: "invalid-token" }) }
    );

    expect(response.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-24: Supplier form submission creates Scope 3 record
// TC-27: Proxy assumptions documented
// TC-28b: Proxy confidence < 1.0
// TC-31: Activity data stored in activityDataJson
// TC-33: Audit event with actor=supplier
// ─────────────────────────────────────────────────────────────────────────────

describe("POST /api/public/supplier/[token]", () => {
  it("TC-24: submission creates Scope 3 record with dataSource=supplier_form", async () => {
    vi.mocked(prisma.supplier.findUnique).mockResolvedValue(
      mockSupplier as never
    );
    vi.mocked(prisma.scope3Category.findUnique).mockResolvedValue(
      mockCategory as never
    );
    vi.mocked(prisma.company.findUniqueOrThrow).mockResolvedValue({
      reportingYear: 2024,
    } as never);
    vi.mocked(prisma.scope3Record.create).mockResolvedValue(
      mockRecord as never
    );

    const request = new Request(
      "http://localhost/api/public/supplier/test-token-001",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: "cat-001",
          spend_eur: 1000,
        }),
      }
    );

    const response = await publicPost(request, {
      params: Promise.resolve({ token: "test-token-001" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // TC-27: verify proxy assumptions are passed to create call
    const createCall = vi.mocked(prisma.scope3Record.create).mock.calls[0][0];
    expect(createCall.data.assumptions).toContain("0.233");

    // TC-28b: confidence < 1.0
    expect(createCall.data.confidence).toBeLessThan(1.0);
    expect(createCall.data.confidence).toBe(0.4);

    // TC-31: activityDataJson contains spend_eur
    const activityData = JSON.parse(createCall.data.activityDataJson as string);
    expect(activityData.spend_eur).toBe(1000);

    // TC-24: dataSource = supplier_form
    expect(createCall.data.dataSource).toBe("supplier_form");
  });

  it("TC-33: creates audit event with actor=supplier", async () => {
    vi.mocked(prisma.supplier.findUnique).mockResolvedValue(
      mockSupplier as never
    );
    vi.mocked(prisma.scope3Category.findUnique).mockResolvedValue(
      mockCategory as never
    );
    vi.mocked(prisma.company.findUniqueOrThrow).mockResolvedValue({
      reportingYear: 2024,
    } as never);
    vi.mocked(prisma.scope3Record.create).mockResolvedValue(
      mockRecord as never
    );

    const request = new Request(
      "http://localhost/api/public/supplier/test-token-001",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: "cat-001",
          spend_eur: 500,
        }),
      }
    );

    await publicPost(request, {
      params: Promise.resolve({ token: "test-token-001" }),
    });

    expect(prisma.auditTrailEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "submitted",
          actor: "supplier",
          entityType: "scope3",
        }),
      })
    );
  });

  it("returns 400 when no activity data provided", async () => {
    vi.mocked(prisma.supplier.findUnique).mockResolvedValue(
      mockSupplier as never
    );

    const request = new Request(
      "http://localhost/api/public/supplier/test-token-001",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: "cat-001" }),
      }
    );

    const response = await publicPost(request, {
      params: Promise.resolve({ token: "test-token-001" }),
    });

    expect(response.status).toBe(400);
  });
});
