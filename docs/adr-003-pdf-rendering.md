# ADR-003: PDF Rendering with Puppeteer (Headless Chromium)

## Status

Accepted

## Context

FR-011 requires server-side PDF generation of a "CSRD Climate Report" containing structured
tables, heading hierarchy, and methodology text. The spec states: "generate HTML then render
to PDF (minimal dependency approach)".

Two broad approaches exist:

### Option A: Headless Chromium (Puppeteer)

Generate an HTML string server-side, launch a headless Chromium instance, load the HTML,
and export to PDF via the Chrome DevTools Protocol.

**Libraries:** `puppeteer` (bundles Chromium, ~300 MB) or `puppeteer-core` +
`@sparticuz/chromium-min` (lighter Chromium build for serverless/Docker, ~50 MB compressed).

**Pros:**
- Perfect HTML/CSS rendering fidelity — the output is exactly what a browser would print.
- TailwindCSS classes and standard CSS work without any adaptation.
- Tables, page breaks, headers, footers all handled by the browser's print engine.
- Widely used in production; mature API.

**Cons:**
- Docker image size increase (~100–300 MB depending on Chromium variant).
- Requires a Linux environment with shared libraries (satisfied by the Node.js Alpine/Debian
  base image).
- Startup latency (~1–2 s) per PDF generation (acceptable given the 10 s NFR-007 budget).

### Option B: Pure-JS HTML-to-PDF (html-pdf-node, jsPDF, pdfmake)

Generate PDF programmatically using a JavaScript-only library without a browser dependency.

- `html-pdf-node`: Thin wrapper — actually uses Puppeteer internally; no advantage over
  using Puppeteer directly, and less control.
- `jsPDF` + `html2canvas`: Converts DOM to canvas then to PDF. Requires a browser DOM
  (not available server-side without jsdom); results in rasterised (non-searchable) text.
- `pdfmake`: Programmatic PDF layout engine (pure JS, no browser needed). High quality output
  but requires content to be defined in pdfmake's own document-definition JSON format — not
  HTML. Significant development effort to replicate table layouts.

**Cons (all pure-JS options):**
- Either require browser DOM (not usable in Next.js Route Handlers server-side) or require
  defining content in a custom non-HTML format.
- pdfmake output is good but developing the document-definition model for tables, methodology
  text, and multi-section layout is more effort than writing HTML.

## Decision

Use **Puppeteer** with the `puppeteer` package (bundled Chromium) for the MVP. If Docker
image size becomes a concern, switch to `puppeteer-core` + `@sparticuz/chromium-min`.

PDF generation flow:
1. Route handler `POST /api/export/pdf` fetches all required data from Prisma.
2. `src/lib/pdf.ts` assembles an HTML string using a template function (plain TypeScript
   string interpolation or a lightweight template helper — no React Server Components in the
   PDF path to avoid complexity).
3. Puppeteer launches headless Chromium, loads the HTML, calls `page.pdf({ format: 'A4', printBackground: true })`.
4. The resulting `Buffer` is returned as `application/pdf` with `Content-Disposition: attachment`.

## Rationale

The "minimal dependency approach" in the spec refers to the overall strategy (generate HTML →
render to PDF) rather than mandating a pure-JS library. Puppeteer is the most reliable
implementation of this strategy because:

- HTML + CSS is the natural language for structured document layout.
- The report's tables and methodology text are straightforward HTML — no complex layout engine
  needed.
- Pure-JS alternatives either require a browser DOM (impractical server-side) or demand
  rewriting the entire report structure in a proprietary format.
- `html-pdf-node` would introduce Puppeteer anyway — using Puppeteer directly gives more
  control and better maintainability.

The 10-second PDF generation budget (NFR-007) comfortably accommodates Puppeteer's 1–2 s
Chromium startup plus rendering time.

## Consequences

**Positive:**
- Full HTML/CSS rendering fidelity with TailwindCSS.
- The HTML template in `src/lib/pdf.ts` is easy to modify without changing core logic.
- Searchable, copy-able text in the output PDF (unlike canvas-based approaches).
- Well-documented API with extensive community support.

**Negative:**
- Docker image is larger (~100–300 MB extra for Chromium). For a local demo this is acceptable.
- Puppeteer must be given the `--no-sandbox` flag when running inside Docker (common
  pattern; document in Dockerfile).
- Chromium binary adds to cold-start time in a serverless context — not a concern for local
  Docker deployment.
- Must ensure `puppeteer` is listed in `dependencies` (not `devDependencies`) so it is
  included in the Docker production build.

## Implementation Notes

- Install: `npm install puppeteer` in `src/`.
- `src/lib/pdf.ts` exports `generatePdfBuffer(data: ReportData): Promise<Buffer>`.
- The HTML template uses inline styles or a `<style>` block for print-safe CSS. TailwindCSS
  CDN `<link>` can be included in the HTML string for consistent styling, or a minimal inline
  stylesheet can be used for portability.
- In `src/Dockerfile`, add `ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false` (default) and ensure
  the base image includes Chromium shared libraries. Use `node:20-slim` with
  `apt-get install -y chromium` or use `node:20` (Debian) which includes them.
- Pass launch args: `args: ['--no-sandbox', '--disable-setuid-sandbox']` for Docker.
- Create an `AuditTrailEvent` (`action: "exported"`, `entityType: "export"`) after successful
  PDF generation inside the route handler.
