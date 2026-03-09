import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    supplier: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/token", () => ({
  generatePublicFormToken: vi.fn(() => "new-random-token"),
}));

import { prisma } from "@/lib/prisma";
import { POST } from "../route";
import { NextRequest } from "next/server";

const mockPrisma = prisma as {
  supplier: {
    findFirst: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
};

describe("POST /api/suppliers/[id]/token", () => {
  beforeEach(() => vi.clearAllMocks());

  it("TC-09: generates new token and returns it", async () => {
    mockPrisma.supplier.findFirst.mockResolvedValue({ id: "s1", companyId: "demo-company-001" });
    mockPrisma.supplier.update.mockResolvedValue({
      id: "s1",
      publicFormToken: "new-random-token",
    });

    const req = new NextRequest("http://localhost/api/suppliers/s1/token", { method: "POST" });
    const res = await POST(req, { params: Promise.resolve({ id: "s1" }) });

    expect(mockPrisma.supplier.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "s1" },
        data: expect.objectContaining({ publicFormToken: expect.any(String) }),
      })
    );
    const json = await res.json() as { publicFormToken: string };
    expect(json.publicFormToken).toBeTruthy();
    expect(res.status).toBe(200);
  });
});
