# ADR-002: PDF Generation Approach

## Status

Accepted

## Context

GreenLedger must produce an audit-ready "CSRD Climate Report" PDF that includes a cover page, an emissions summary table, a Scope 3 breakdown, methodology notes, and an assumptions/data quality section. The PDF must be generated server-side on demand via a GET request to `/api/export/pdf` and streamed back to the browser as a downloadable file.

Key requirements for the PDF:

- **Audit quality** — the output must look professional and structured enough for auditor review; tables, headings, and data quality notes must be clearly formatted.
- **Server-side generation** — the PDF is generated in a Next.js Route Handler; no client-side rendering.
- **HTML source of truth** — the report layout is already defined in HTML/CSS (TailwindCSS); reusing that representation avoids duplicating layout logic in a separate PDF-specific DSL.
- **Minimal runtime dependency footprint** — the Docker image should remain reasonably sized; heavyweight dependencies that duplicate browser rendering engines are acceptable only if they are the best fit.

## Decision

Use **Puppeteer** (headless Chromium) for server-side PDF generation. The implementation flow is:

1. A Next.js Route Handler (`GET /api/export/pdf`) assembles all required data from Prisma.
2. A dedicated server-side HTML template function in `src/lib/pdf/report-template.ts` renders the full report as an HTML string (TailwindCSS CDN or inline styles).
3. Puppeteer launches a headless Chromium instance, loads the HTML, and calls `page.pdf()` to produce a PDF buffer.
4. The buffer is returned as a `application/pdf` response with `Content-Disposition: attachment`.
5. An `AuditTrailEvent` with `action = "exported"` is written to the database after successful generation.

## Rationale

Puppeteer produces PDFs by driving the same rendering engine (Blink) used by Google Chrome. This means:

- **Pixel-accurate layout** — CSS Grid, Flexbox, and table rendering behave identically to what a user would see in a browser. No PDF-specific layout code is needed.
- **HTML reuse** — the same semantic HTML structure (headings, `<table>`, `<ul>`) used in the UI can be reused in the PDF template, keeping layout logic in one language.
- **Professional output** — Chromium's print CSS support (page breaks, headers/footers via `@page` rules) enables audit-quality pagination without a dedicated PDF layout library.
- **Active maintenance** — Puppeteer is maintained by the Chrome DevTools team with regular updates aligned to Chromium releases.

The primary trade-off is Docker image size: installing Chromium adds ~300–400 MB to the image. For a local demo scenario this is acceptable.

## Alternatives Considered

### Alternative A: React-PDF (`@react-pdf/renderer`)

React-PDF uses a custom React reconciler to render PDF primitives (`<Document>`, `<Page>`, `<Text>`, `<View>`). It produces small, text-based PDFs with no browser dependency.

**Pros:** Small runtime, no headless browser needed, pure Node.js, precise control over PDF structure.  
**Cons:** Requires a completely separate layout system from the HTML/TailwindCSS UI. Tables with dynamic rows (Scope 3 breakdown, assumptions list) require manual column width calculations. The output looks noticeably different from the HTML UI, requiring extra design effort. Complex multi-page layouts with dynamic content are difficult to maintain.

**Rejected** because the duplicate layout effort and limited table/CSS support are not acceptable for audit-quality output.

### Alternative B: `html-pdf-node` / `html-pdf`

`html-pdf-node` is a thin wrapper around Puppeteer (or PhantomJS in older versions of `html-pdf`). It provides a simpler API but with fewer configuration options.

**Pros:** Simpler API than raw Puppeteer.  
**Cons:** `html-pdf` uses the abandoned PhantomJS engine. `html-pdf-node` is a Puppeteer wrapper with less maintenance activity and fewer options than using Puppeteer directly. Using Puppeteer directly gives more control over page size, margins, headers/footers, and print media queries.

**Rejected** in favour of direct Puppeteer usage for better control and maintenance guarantees.

### Alternative C: jsPDF (client-side or server-side)

jsPDF generates PDFs by drawing directly to a PDF canvas using JavaScript. It can run in Node.js.

**Pros:** Small dependency, no browser process needed, works client-side if needed.  
**Cons:** jsPDF does not render HTML/CSS. Building the full report layout (tables, conditional sections, dynamic data) requires low-level PDF drawing commands (`doc.text()`, `doc.line()`, `autoTable` plugin). This is brittle, hard to maintain, and produces less polished output than browser-rendered HTML. The `jspdf-autotable` plugin helps with tables but still requires manual column management.

**Rejected** because generating structured, multi-section audit reports with dynamic data is significantly harder to maintain than HTML-based generation.

### Alternative D: WeasyPrint (Python-based, external process)

WeasyPrint is a Python HTML/CSS-to-PDF library. It could be invoked as a child process from Node.js.

**Pros:** Good CSS support, text-based PDF output, no Chromium needed.  
**Cons:** Requires a Python runtime in the Docker image, cross-process communication overhead, and adds operational complexity. Not idiomatic for a Node.js/Next.js project.

**Rejected** due to the added runtime dependency and operational complexity.

## Consequences

### Positive

- Audit-quality, professionally formatted PDFs with full CSS support (tables, pagination, print styles).
- The HTML report template reuses the same semantic structure as the web UI.
- Puppeteer's `page.pdf()` API provides precise control over page format (A4), margins, and header/footer content.
- No separate layout language to learn or maintain alongside TailwindCSS.

### Negative

- Chromium installation adds ~300–400 MB to the Docker image. Mitigated by using `puppeteer-core` with a pinned browser or the `chromium` system package in the Dockerfile rather than the full `puppeteer` package (which bundles its own Chromium).
- PDF generation is slower than pure JS approaches (~1–3 seconds for a full report). Acceptable for an on-demand export endpoint; not suitable for high-throughput use cases.
- Headless Chromium requires specific Linux system dependencies in Docker (`--no-sandbox` flag needed in containerised environments). These must be documented in the Dockerfile.
- In serverless/edge environments, Puppeteer cannot run. The current architecture (containerised Next.js) is not affected, but this rules out edge deployment in the future.
