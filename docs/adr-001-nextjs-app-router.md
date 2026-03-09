# ADR-001: Next.js App Router with Server Components and Root Redirect

## Status

Accepted

## Context

GreenLedger is a full-stack mono-repo application. The spec mandates Next.js (App Router)
for both UI rendering and API (Route Handlers). Two related decisions needed documenting:

1. How to apply the App Router model — specifically, when to use server vs. client components.
2. What to display at the root path `/` — a landing/marketing page or a direct redirect to
   the application dashboard.

Because this is a local-demo-only MVP with no marketing or authentication, these decisions
are low-risk but influence the entire project's code conventions.

## Decision

- Use Next.js App Router with **server components as the default**. Mark components
  `"use client"` only when browser APIs or React state/effects are strictly required
  (e.g., interactive forms, copy-to-clipboard buttons, real-time UI state).

- The root path `/` uses a `page.tsx` that calls Next.js `redirect('/dashboard')` to send
  users directly to the dashboard. No landing page is created for the MVP.

## Rationale

**Server components by default** is the Next.js App Router convention. For a B2B data
application, most pages are read-heavy and benefit from server-side data fetching with no
client-side JS overhead. Interactive elements (add/edit forms, copy link button) are isolated
as client components, keeping the bundle small.

**Root redirect**: The MVP is a local demo tool, not a marketing site. There is no
unauthenticated landing page to show. A redirect to `/dashboard` is the simplest,
most appropriate behaviour and matches how internal tools are commonly structured.
A landing page would add scope without value for the demo.

## Consequences

**Positive:**

- Server components give fast initial page loads with zero client-side JS for read-only views.
- Clear `"use client"` boundaries make the codebase easier to audit and test.
- Root redirect ensures demos start immediately at the most useful page.
- Consistent with Next.js best practices documented in the official App Router guides.

**Negative:**

- Developers must be deliberate about the server/client boundary; accidental mixing can cause
  hydration errors or serialisation issues with Prisma model objects (which must not be passed
  directly as props to client components — use plain serialisable data shapes instead).

- If a landing page is ever needed in the future, the root `page.tsx` must be refactored.

## Implementation Notes

- `src/app/page.tsx`: `import { redirect } from 'next/navigation'; export default function RootPage() { redirect('/dashboard'); }`
- `src/app/layout.tsx`: Root layout renders the persistent sidebar navigation for all internal routes. The public supplier form (`/public/supplier/[token]`) should use a separate nested layout that omits the sidebar.
- Data fetched in server components should be passed to child client components as serialisable plain objects (not Prisma model instances).
- Client component files are co-located in the same feature directory with a `"use client"` directive at the top.
