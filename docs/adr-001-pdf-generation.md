# ADR-001: PDF Generation Library

## Status

Accepted

## Context

The GreenLedger MVP must generate a multi-section "CSRD Climate Report" PDF server-side from
a Next.js Route Handler. The report includes a cover page, summary table, Scope 3 breakdown
table, methodology narrative, and an assumptions/data-quality table.

The Feature Specification explicitly requires:

> "HTML is rendered server-side then converted to PDF using a minimal library (no heavyweight
> headless browser required for MVP)"

Constraints:
- Must work in a Node.js server environment (Next.js Route Handler)
- Must produce a downloadable PDF binary (`application/pdf`)
- Should avoid native binaries or OS-level dependencies (Chromium, wkhtmltopdf, PhantomJS)
- Dependency footprint should be small for a demo application
- Must support tables, multi-page layout, and basic styling

## Options Considered

### Option 1: `@react-pdf/renderer`

A React-based PDF generation library that renders a React component tree (using its own
layout primitives: `<Document>`, `<Page>`, `<View>`, `<Text>`, `<Image>`) directly to a PDF
buffer using a pure-JavaScript PDF engine.

**How it works:** Define the report as React components using `@react-pdf/renderer` primitives
→ call `renderToBuffer(document)` server-side → return the buffer as an HTTP response.

**Pros:**
- **Zero native binaries** — pure JS; no Chromium download, no OS-level deps
- **Works in Next.js route handlers** out of the box
- **React-like developer experience** — familiar patterns for a Next.js team
- **Built-in multi-page layout** — automatic page breaks, repeating headers
- **Small footprint** — single npm dependency (~2 MB installed)
- **Actively maintained** (>40k GitHub stars, regular releases)
- **Server-side `renderToBuffer()`** — no client-side rendering required

**Cons:**
- Uses its own layout engine (not HTML/CSS) — requires learning its `<View>`/`<Text>` primitives
- CSS Flexbox subset only (no Grid, no complex selectors)
- Not suitable for pixel-perfect browser-style rendering

### Option 2: `puppeteer` / `playwright`

Launch a headless Chromium browser, render an HTML page, and use `page.pdf()` to export.

**Pros:**
- Full HTML + CSS rendering fidelity — use standard web technologies
- Can render any HTML template directly

**Cons:**
- **Heavyweight** — Chromium download is ~300 MB; Docker image becomes very large
- **Slow startup** — browser launch adds 3–8 seconds latency per export
- **Native binary dependency** — breaks in some serverless/container environments without extra
  configuration
- Violates the spec requirement: "no heavyweight headless browser required for MVP"

### Option 3: `jspdf` + `html2canvas`

Capture an HTML DOM element as a canvas image, then embed in a PDF.

**Pros:**
- Can render existing HTML/CSS styles

**Cons:**
- **Client-side only** — requires the DOM; cannot run in a Node.js Route Handler
- Produces rasterised (image-based) PDF — not text-selectable, poor for audit documents
- Large image files; no proper pagination

### Option 4: `pdfmake`

A Node.js-compatible PDF library that uses a JSON document definition (not HTML/React).

**Pros:**
- Pure JS, no native deps
- Works server-side

**Cons:**
- JSON-based API is verbose and harder to maintain than React components
- Less ecosystem support than `@react-pdf/renderer`
- Requires manual layout calculation for tables

## Decision

**Use `@react-pdf/renderer`.**

## Rationale

`@react-pdf/renderer` is the only option that satisfies all three key constraints simultaneously:

1. No native binaries / no headless browser
2. Works server-side in a Next.js Route Handler
3. Produces a real, text-selectable PDF with proper pagination and tables

The React-like API is a natural fit for a Next.js codebase. The learning curve for its layout
primitives is low for developers already familiar with Flexbox. The template lives at
`src/lib/pdf/report-template.tsx` as a standard React component and is straightforward to
extend.

## Consequences

### Positive
- No OS-level dependencies; Docker image stays small
- PDF generation is fast (no browser startup overhead; typically < 2s for a typical report)
- The report template is version-controlled as React JSX, making it easy to review and modify
- Satisfies the 15-second performance budget with significant margin

### Negative
- PDF styling uses `@react-pdf/renderer` primitives, not standard HTML/CSS; developers must
  learn a small subset of its API
- Complex table styling (borders, cell padding) requires explicit style objects

## Implementation Notes

For the Developer agent:

- **Dependency:** `@react-pdf/renderer` (latest stable)
- **Template file:** `src/lib/pdf/report-template.tsx`
  - Export a single `ReportDocument({ data: ReportData })` React component
  - Sections: Cover → Summary Table → Scope 3 Breakdown → Methodology → Assumptions
- **Generator file:** `src/lib/pdf/generate-report.ts`
  - Export `generateReport(prisma): Promise<Buffer>` function
  - Queries all required data, builds `ReportData`, calls `renderToBuffer(<ReportDocument />)`
  - Called only from `src/app/api/export/route.ts`
- **Route handler** `src/app/api/export/route.ts`:
  - `POST` handler
  - Calls `generateReport(prisma)`
  - Returns `new Response(buffer, { headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="csrd-climate-report.pdf"' } })`
  - Creates `AuditTrailEvent` with `action="exported"`, `actor="user"`, `entityType="export"`
- **`next.config.mjs`:** Add `@react-pdf/renderer` to `serverExternalPackages` if needed to
  prevent bundling issues with its internal Node.js usage
