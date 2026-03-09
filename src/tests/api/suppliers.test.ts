import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma client
vi.mock("@/lib/prisma", () => ({
  prisma: {
    supplier: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    auditTrailEvent: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { GET, POST } from "@/app/api/suppliers/route";

const mockSupplier = {
  id: "supplier-001",
  companyId: "demo-company-001",
  name: "Acme Logistics GmbH",
  country: "DE",
  sector: "Logistics",
  contactEmail: "contact@acme.de",
  publicFormToken: "token-abc-123",
  status: "active",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.auditTrailEvent.create).mockResolvedValue({} as never);
});

// TC-05: Supplier list returns all suppliers
describe("GET /api/suppliers", () => {
  it("TC-05: returns supplier list with 200", async () => {
    vi.mocked(prisma.supplier.findMany).mockResolvedValue([mockSupplier] as never);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe("Acme Logistics GmbH");
  });
});

// TC-06, TC-07: Create supplier
describe("POST /api/suppliers", () => {
  it("TC-06: creates supplier with auto-generated token", async () => {
    const created = {
      ...mockSupplier,
      id: "new-supplier-001",
      publicFormToken: "some-uuid-token",
    };
    vi.mocked(prisma.supplier.create).mockResolvedValue(created as never);

    const request = new Request("http://localhost/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Acme Logistics GmbH",
        country: "DE",
        sector: "Logistics",
        contactEmail: "contact@acme.de",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.name).toBe("Acme Logistics GmbH");
    expect(data.publicFormToken).toBeTruthy();
  });

  it("TC-07: publicFormToken is present on created supplier", async () => {
    const created = { ...mockSupplier, publicFormToken: "unique-token-xyz" };
    vi.mocked(prisma.supplier.create).mockResolvedValue(created as never);

    const request = new Request("http://localhost/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Supplier",
        country: "DE",
        sector: "Technology",
        contactEmail: "test@example.com",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.publicFormToken).toBeDefined();
    expect(typeof data.publicFormToken).toBe("string");
    expect(data.publicFormToken.length).toBeGreaterThan(0);
  });

  // TC-39: Missing required fields return 400
  it("TC-39: returns 400 when name is missing", async () => {
    const request = new Request("http://localhost/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        country: "DE",
        sector: "Logistics",
        contactEmail: "contact@acme.de",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeTruthy();
  });

  it("TC-40: returns 400 when contactEmail is missing", async () => {
    const request = new Request("http://localhost/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Supplier",
        country: "DE",
        sector: "Logistics",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});

// TC-32: Audit event created for supplier create
describe("Audit trail", () => {
  it("TC-32: creates audit event when supplier is created", async () => {
    vi.mocked(prisma.supplier.create).mockResolvedValue(mockSupplier as never);

    const request = new Request("http://localhost/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Acme GmbH",
        country: "DE",
        sector: "Logistics",
        contactEmail: "contact@acme.de",
      }),
    });

    await POST(request);

    expect(prisma.auditTrailEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          entityType: "supplier",
          action: "created",
          actor: "user",
        }),
      })
    );
  });
});
