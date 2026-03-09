import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    scope3Category: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { GET } from "../route";
import { PUT } from "../[id]/route";
import { NextRequest } from "next/server";

const mockPrisma = prisma as {
  scope3Category: {
    findMany: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
};

const makeFifteenCategories = () =>
  Array.from({ length: 15 }, (_, i) => ({
    id: `cat-${i + 1}`,
    code: `C${i + 1}`,
    name: `Category ${i + 1}`,
    material: false,
    materialityReason: null,
  }));

describe("GET /api/scope3/categories", () => {
  beforeEach(() => vi.clearAllMocks());

  it("TC-17: returns all 15 categories", async () => {
    mockPrisma.scope3Category.findMany.mockResolvedValue(makeFifteenCategories());

    const res = await GET();
    const json = await res.json() as unknown[];
    expect(Array.isArray(json)).toBe(true);
    expect(json).toHaveLength(15);
    expect(res.status).toBe(200);
  });
});

describe("PUT /api/scope3/categories/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("TC-18: updates material flag", async () => {
    mockPrisma.scope3Category.update.mockResolvedValue({
      id: "cat-1",
      code: "C1",
      material: true,
      materialityReason: "Primary spend category",
    });

    const req = new NextRequest("http://localhost/api/scope3/categories/cat-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ material: true, materialityReason: "Primary spend category" }),
    });
    const res = await PUT(req, { params: Promise.resolve({ id: "cat-1" }) });

    expect(mockPrisma.scope3Category.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "cat-1" },
        data: { material: true, materialityReason: "Primary spend category" },
      })
    );
    expect(res.status).toBe(200);
  });
});
