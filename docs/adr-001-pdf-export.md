# ADR-001: PDF Export Approach

## Status

Accepted

## Context

The GreenLedger MVP must generate a "CSRD Climate Report" PDF server-side. The report is a
structured document containing: a cover page, summary emissions table, Scope 3 category
breakdown, methodology notes, and an assumptions/data-quality table.

The spec states: *"generate HTML then render to PDF (minimal dependency approach)"* and flags
that Puppeteer adds ~200 MB to the Docker image. The Feature Specification lists the following
candidate technologies:

- **Puppeteer** (full Chromium, ~200 MB Docker layer)
- **`@sparticuz/chromium` + `puppeteer-core`** (Lambda/container-optimised Chromium, ~45 MB)
- **`html-pdf-node`** (wraps Puppeteer internally; same weight problem)
- **`jsPDF`** (client-side, limited CSS support; not suitable for server-side structured reports)
- **`@react-pdf/renderer`** (pure-JS React-based PDF renderer, ~5 MB, no Chromium required)

The report is a demo artifact, not a pixel-perfect reproduction of a web page, so exact CSS
fidelity is not required. The PDF must be self-contained, fully server-rendered, and returned
via a Next.js API Route Handler (`GET /api/export/pdf`).

## Options Considered

### Option A: Puppeteer (full Chromium)

Start a headless Chromium browser, navigate to an internal HTML report endpoint, and print to PDF.

**Pros:**
- Highest CSS/layout fidelity — any valid HTML/CSS renders correctly
- Familiar browser-based rendering model

**Cons:**
- Docker image grows by ~200 MB (Chromium binary)
- Slow cold start in Docker (3–10 s to launch browser)
- Requires additional Linux shared libraries in the Docker image
- Overkill for a structured tabular report

### Option B: `@sparticuz/chromium` + `puppeteer-core`

Use a pre-compiled, size-optimised Chromium (~45 MB gzipped) together with `puppeteer-core`.

**Pros:**
- Retains Chromium-level CSS fidelity
- Docker image ~45–60 MB lighter than Option A

**Cons:**
- Still requires Chromium binary in the image
- More complex setup (custom `executablePath`, layer configuration)
- Cold-start latency still present

### Option C: `@react-pdf/renderer` (Recommended)

Render React components directly to a PDF byte stream using a pure-JS layout engine. No
Chromium or native binaries are required.

**Pros:**
- ~5 MB additional dependency, zero native binaries — minimal Docker image impact
- Runs entirely in the Node.js process; no child-process launch overhead
- Works out of the box in Next.js Route Handlers (`Response` with `Content-Type: application/pdf`)
- Good primitives for structured documents: `Document`, `Page`, `View`, `Text`, `StyleSheet`
- Font embedding supported (for GDPR-compliant localisation, e.g., German characters)

**Cons:**
- Uses its own layout model (Yoga/Flexbox subset) rather than HTML/CSS — template must be
  written in React PDF JSX, not standard HTML/CSS
- Limited styling compared to a full browser (no arbitrary CSS grid, no SVG charts)
- For a structured table-based report, these constraints are acceptable

### Option D: Printable HTML page (no server-side PDF)

Provide a dedicated `/print` route with `@media print` CSS; user triggers browser print-to-PDF.

**Pros:**
- Zero additional dependencies
- Full browser CSS fidelity

**Cons:**
- Does not satisfy the requirement of a downloadable PDF artifact
- Output quality depends on the user's browser and OS
- Cannot log an `AuditTrailEvent` reliably (no server-side trigger)

## Decision

**Use `@react-pdf/renderer` (Option C).**

## Rationale

The GreenLedger report is a structured document — tables, headings, and paragraphs. It does
not require arbitrary CSS layout or interactive JavaScript. `@react-pdf/renderer` is purpose-built
for exactly this use case: generating structured PDFs from React components server-side, with
no Chromium dependency. The Docker image stays lean, cold-start is negligible, and the
implementation integrates naturally into Next.js Route Handlers.

The styling constraints of `@react-pdf/renderer` are acceptable because the report layout is
well-defined (fixed sections, tabular data), and the React component model matches the project's
existing Next.js + TypeScript conventions.

## Consequences

### Positive

- Docker image remains small (no Chromium binary)
- PDF generation is synchronous and fast (no browser launch)
- PDF template is versioned as React components alongside application code
- Report is always self-contained (all data injected at render time)

### Negative

- Report template must be written in `@react-pdf/renderer` JSX, not standard HTML/CSS
- Developers unfamiliar with `@react-pdf/renderer` face a small learning curve
- Complex visual layouts (charts, SVG graphics) would require additional libraries (not needed
  for MVP)

## Implementation Notes

### File locations

```
src/lib/pdf/
  components.tsx   # @react-pdf/renderer React components for report sections
  generate.ts      # generateReport(data: ReportData): Promise<Buffer>
src/app/api/export/pdf/
  route.ts         # GET handler — fetches data, calls generate(), returns Response
```

### API Route pattern

```ts
// GET /api/export/pdf
export async function GET() {
  const data = await fetchReportData();
  const buffer = await generateReport(data);
  // Log AuditTrailEvent
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
```

### Report data shape

All data is fetched inside the Route Handler at generation time. No external URLs are embedded
in the PDF. Numeric values are formatted to two decimal places before passing to the template.

### Font handling

Register a Unicode-compatible font (e.g., Noto Sans) via `Font.register()` to ensure German
characters (ä, ö, ü, ß) render correctly.
