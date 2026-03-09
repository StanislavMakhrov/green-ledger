import { describe, it, expect, vi } from "vitest";

// Mock prisma to avoid needing the generated Prisma client in tests.
// renderReportHtml is a pure function that doesn't use the database.
vi.mock("./prisma", () => ({
  prisma: {},
}));

import { renderReportHtml, type ReportData } from "./pdf";

const sampleData: ReportData = {
  cover: {
    companyName: "Test GmbH",
    reportingYear: 2024,
    orgBoundary: "operational control",
    generatedDate: "01/01/2024",
  },
  summary: { scope1: 120.5, scope2: 85.2, scope3: 200.0, total: 405.7 },
  scope3Breakdown: [
    { categoryName: "Purchased goods and services", valueTco2e: 150.0, calculationMethod: "spend based", dataSource: "proxy" },
  ],
  nonMaterialExists: false,
  methodology: {
    scope1: "Direct measurement from utility bills.",
    scope2: "Location-based using UBA grid factor.",
    scope3: "Spend-based proxy with DEFRA factors.",
  },
  assumptionsDataQuality: [
    {
      supplierName: "Acme GmbH",
      categoryName: "Purchased goods and services",
      dataSource: "proxy",
      confidence: 0.6,
      assumptions: "Proxy factor applied",
    },
  ],
  proxyFactorSource: "DEFRA/Exiobase average",
};

describe("renderReportHtml", () => {
  it("produces a valid HTML document", () => {
    const html = renderReportHtml(sampleData);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
  });

  it("includes company name and reporting year", () => {
    const html = renderReportHtml(sampleData);
    expect(html).toContain("Test GmbH");
    expect(html).toContain("2024");
  });

  it("includes all four summary totals", () => {
    const html = renderReportHtml(sampleData);
    expect(html).toContain("120.50"); // scope1
    expect(html).toContain("85.20");  // scope2
    expect(html).toContain("200.00"); // scope3
    expect(html).toContain("405.70"); // total
  });

  it("includes scope 3 breakdown for material categories", () => {
    const html = renderReportHtml(sampleData);
    expect(html).toContain("Purchased goods and services");
    expect(html).toContain("150.00");
  });

  it("includes methodology notes", () => {
    const html = renderReportHtml(sampleData);
    expect(html).toContain("Direct measurement from utility bills.");
    expect(html).toContain("Location-based using UBA grid factor.");
  });

  it("includes assumptions section with supplier data", () => {
    const html = renderReportHtml(sampleData);
    expect(html).toContain("Acme GmbH");
    expect(html).toContain("60%"); // confidence 0.6 → 60%
    expect(html).toContain("Proxy factor applied");
  });

  it("shows 'No Scope 3 records' message when breakdown is empty", () => {
    const emptyData = { ...sampleData, scope3Breakdown: [] };
    const html = renderReportHtml(emptyData);
    expect(html).toContain("No Scope 3 records");
  });

  it("shows non-material note when nonMaterialExists is true", () => {
    const dataWithNonMaterial = { ...sampleData, nonMaterialExists: true };
    const html = renderReportHtml(dataWithNonMaterial);
    expect(html).toContain("non-material categories");
  });

  it("escapes HTML special characters in user-provided fields to prevent XSS", () => {
    const xssData: ReportData = {
      ...sampleData,
      cover: { ...sampleData.cover, companyName: "<script>alert('xss')</script>" },
      methodology: {
        scope1: "<b>bold & dangerous</b>",
        scope2: "safe",
        scope3: 'quote: "test"',
      },
      assumptionsDataQuality: [
        {
          supplierName: "<evil>",
          categoryName: "Safe & Category",
          dataSource: "proxy",
          confidence: 0.6,
          assumptions: "A > B",
        },
      ],
    };
    const html = renderReportHtml(xssData);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;b&gt;bold &amp; dangerous&lt;/b&gt;");
    expect(html).toContain("&lt;evil&gt;");
    expect(html).toContain("A &gt; B");
  });

})
