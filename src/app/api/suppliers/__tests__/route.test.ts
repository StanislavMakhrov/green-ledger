import { describe, it, expect, vi, beforeEach } from "vitest";

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

vi.mock("@/lib/token", () => ({
  generatePublicFormToken: vi.fn(() => "test-token-abc"),
}));

import { prisma } from "@/lib/prisma";
import { GET, POST } from "../route";
import { PUT, DELETE } from "../[id]/route";
import { NextRequest } from "next/server";

const mockPrisma = prisma as unknown as {
  supplier: {
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  auditTrailEvent: { create: ReturnType<typeof vi.fn> };
};

const makeRequest = (body?: unknown, method = "GET") =>
  new NextRequest("http://localhost/api/suppliers", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

describe("GET /api/suppliers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("TC-06: returns list of suppliers", async () => {
    mockPrisma.supplier.findMany.mockResolvedValue([
      { id: "1", name: "Alpha", publicFormToken: "t1", status: "active" },
      { id: "2", name: "Beta", publicFormToken: "t2", status: "active" },
    ]);

    const res = await GET();
    const json = await res.json() as unknown[];
    expect(Array.isArray(json)).toBe(true);
    expect(json).toHaveLength(2);
    expect(res.status).toBe(200);
  });
});

describe("POST /api/suppliers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("TC-10: creates supplier with auto-generated publicFormToken", async () => {
    const newSupplier = {
      id: "new-1",
      name: "Test Supplier",
      country: "DE",
      sector: "Mfg",
      contactEmail: "x@y.com",
      publicFormToken: "test-token-abc",
      status: "active",
      companyId: "demo-company-001",
    };
    mockPrisma.supplier.create.mockResolvedValue(newSupplier);
    mockPrisma.auditTrailEvent.create.mockResolvedValue({});

    const req = makeRequest({ name: "Test Supplier", country: "DE", sector: "Mfg", contactEmail: "x@y.com" }, "POST");
    const res = await POST(req);

    expect(mockPrisma.supplier.create).toHaveBeenCalled();
    const createCall = mockPrisma.supplier.create.mock.calls[0] as [{ data: { publicFormToken: string } }];
    expect(createCall[0].data.publicFormToken).toBeTruthy();
    expect(createCall[0].data.publicFormToken.length).toBeGreaterThan(0);
    expect(res.status).toBe(201);
  });
});

describe("PUT /api/suppliers/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("TC-07: updates supplier fields", async () => {
    mockPrisma.supplier.findFirst.mockResolvedValue({ id: "s1", companyId: "demo-company-001" });
    mockPrisma.supplier.update.mockResolvedValue({ id: "s1", name: "New Name", status: "active" });
    mockPrisma.auditTrailEvent.create.mockResolvedValue({});

    const req = new NextRequest("http://localhost/api/suppliers/s1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Name" }),
    });
    const res = await PUT(req, { params: Promise.resolve({ id: "s1" }) });

    expect(mockPrisma.supplier.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "s1" }, data: { name: "New Name" } })
    );
    expect(res.status).toBe(200);
    const json = await res.json() as { name: string };
    expect(json.name).toBe("New Name");
  });
});

describe("DELETE /api/suppliers/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("TC-08: sets status to inactive (soft delete)", async () => {
    mockPrisma.supplier.findFirst.mockResolvedValue({ id: "s1", companyId: "demo-company-001" });
    mockPrisma.supplier.update.mockResolvedValue({ id: "s1", status: "inactive" });
    mockPrisma.auditTrailEvent.create.mockResolvedValue({});

    const req = new NextRequest("http://localhost/api/suppliers/s1", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ id: "s1" }) });

    expect(mockPrisma.supplier.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "s1" }, data: { status: "inactive" } })
    );
    expect(mockPrisma.supplier.delete).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
  });
});
