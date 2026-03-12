import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/prisma", () => ({
  prisma: {
    supplier: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/audit", () => ({
  logAuditEvent: vi.fn(),
}));

vi.mock("@/lib/excel/supplier-export", () => ({
  generateSupplierExcel: vi.fn().mockResolvedValue(Buffer.from("PK\x03\x04mock")),
}));

// Import AFTER mocks are registered
import { GET } from "@/app/api/suppliers/export/route";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

const mockPrismaFindMany = vi.mocked(prisma.supplier.findMany);
const mockLogAuditEvent = vi.mocked(logAuditEvent);

const MOCK_SUPPLIERS = [
  {
    id: "supplier-1",
    companyId: "00000000-0000-0000-0000-000000000001",
    name: "Acme Corp",
    country: "DE",
    sector: "Manufacturing",
    contactEmail: "acme@example.com",
    publicFormToken: "token-1",
    status: "active" as const,
  },
];

function makeRequest(url: string) {
  return new NextRequest(new URL(url, "http://localhost"));
}

describe("GET /api/suppliers/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TC-17: 400 when ids param is absent
  it("TC-17: returns 400 when ids query parameter is absent", async () => {
    const req = makeRequest("http://localhost/api/suppliers/export");
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/ids/i);
  });

  // TC-18: 400 when ids is present but empty string
  it("TC-18: returns 400 when ids parameter is empty string", async () => {
    const req = makeRequest("http://localhost/api/suppliers/export?ids=");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  // TC-19: 404 when no suppliers found
  it("TC-19: returns 404 when Prisma returns no matching suppliers", async () => {
    mockPrismaFindMany.mockResolvedValueOnce([]);
    const req = makeRequest(
      "http://localhost/api/suppliers/export?ids=non-existent-id"
    );
    const res = await GET(req);
    expect(res.status).toBe(404);
  });

  // TC-16: 200 with correct Content-Type and Content-Disposition headers
  it("TC-16: returns 200 with correct Content-Type and Content-Disposition on success", async () => {
    mockPrismaFindMany.mockResolvedValueOnce(MOCK_SUPPLIERS);
    const req = makeRequest(
      "http://localhost/api/suppliers/export?ids=supplier-1"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    const disposition = res.headers.get("Content-Disposition") ?? "";
    expect(disposition).toMatch(/attachment; filename="suppliers-export-\d{4}-\d{2}-\d{2}\.xlsx"/);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  // TC-20: 500 on unexpected Prisma error; no internal message in body
  it("TC-20: returns 500 on Prisma error without leaking internal message", async () => {
    mockPrismaFindMany.mockRejectedValueOnce(
      new Error("Internal DB connection error — secret credentials")
    );
    const req = makeRequest(
      "http://localhost/api/suppliers/export?ids=supplier-1"
    );
    const res = await GET(req);
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string };
    // Response must NOT contain the internal error message
    expect(body.error).not.toContain("secret credentials");
  });

  // TC-21: logAuditEvent called exactly once with correct params
  it("TC-21: calls logAuditEvent exactly once with entityType export and action exported", async () => {
    mockPrismaFindMany.mockResolvedValueOnce(MOCK_SUPPLIERS);
    const req = makeRequest(
      "http://localhost/api/suppliers/export?ids=supplier-1"
    );
    await GET(req);
    expect(mockLogAuditEvent).toHaveBeenCalledTimes(1);
    expect(mockLogAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: "export",
        action: "exported",
        actor: "system",
        comment: expect.stringContaining("1"),
      })
    );
  });
});
