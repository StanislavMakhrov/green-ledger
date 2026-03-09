# ADR-004: Next.js App Router Structure and Route Groups

## Status

Accepted

## Context

GreenLedger is a full-stack Next.js application using the App Router. It serves two distinct
user-facing experiences with different layout requirements:

1. **Application UI** — the sustainability manager's workspace: dashboard, suppliers, scope
   records, methodology notes, and PDF export. These pages share a persistent sidebar navigation
   with the company name and reporting year displayed.

2. **Public supplier form** — a tokenized, publicly accessible page at
   `/public/supplier/[token]`. This page has no authentication context, no sidebar, and a
   minimal layout focused on the data entry form.

The project specification requires:
- App Router conventions (`layout.tsx`, `page.tsx`, `route.ts`)
- All source code in `src/`
- Server components by default; `"use client"` only when required

## Options Considered

### Option 1: Route Groups — `(app)` and `(public)`

Use Next.js [route groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups)
to partition the two experiences without affecting URL paths:

```
src/app/
  layout.tsx                 # Root HTML shell (html, body, fonts, global CSS)
  page.tsx                   # Redirect → /dashboard
  (app)/
    layout.tsx               # Sidebar + main content area
    dashboard/page.tsx       # → /dashboard
    suppliers/page.tsx       # → /suppliers
    scope-1/page.tsx         # → /scope-1
    scope-2/page.tsx         # → /scope-2
    scope-3/page.tsx         # → /scope-3
    methodology/page.tsx     # → /methodology
    export/page.tsx          # → /export
  (public)/
    public/
      supplier/
        [token]/
          page.tsx           # → /public/supplier/[token]
  api/
    ...                      # Route handlers (unaffected by route groups)
```

**Pros:**
- Clean separation of layout concerns: app pages get the sidebar, public form gets a bare page
- Route group folder names `(app)` and `(public)` do not appear in URLs
- Easy to add future public pages (e.g., `/public/thank-you`) under `(public)/`
- Follows the Next.js recommended pattern for layout segmentation
- A future authentication layer could be applied to `(app)/layout.tsx` without touching the
  public form

**Cons:**
- Adds one level of folder nesting (minor)
- Developers unfamiliar with route groups may be confused initially (minor — well documented
  in Next.js docs)

### Option 2: Flat Structure Under `app/`

All pages at the same nesting level with no route groups:

```
src/app/
  layout.tsx                 # Single layout with conditional sidebar
  dashboard/page.tsx
  suppliers/page.tsx
  ...
  public/
    supplier/
      [token]/
        page.tsx
```

The root `layout.tsx` conditionally renders the sidebar based on the current path using
`usePathname()`.

**Pros:**
- Simpler folder structure — fewer nested directories

**Cons:**
- Root `layout.tsx` becomes a `"use client"` component (needs `usePathname()` for conditional
  sidebar) — this prevents it from being a server component and breaks server-side metadata
  for all pages
- Conditional layout logic is fragile — any new public URL must be added to the exclusion list
- No clean boundary for future auth middleware (can't use Next.js `matcher` on route groups)
- Mixed layout concerns in a single file; harder to maintain

### Option 3: Parallel Routes (`@sidebar`)

Use Next.js parallel route slots to inject the sidebar:

**Pros:**
- Maximally granular layout control

**Cons:**
- Overkill for this use case — parallel routes are designed for complex simultaneous page
  compositions (e.g., modals)
- Significantly more complex to set up and reason about
- Not the idiomatic approach for a sidebar layout

## Decision

**Use route groups `(app)` and `(public)` — Option 1.**

## Rationale

Route groups are the idiomatic Next.js App Router solution for sharing layouts across a subset
of routes. They allow:

1. The `(app)/layout.tsx` to provide the sidebar navigation without any client-side path checks
2. The `(public)/` route group to have a completely bare layout (no sidebar, minimal wrapper)
3. Both layouts to remain server components — no `"use client"` needed for layout logic

This approach also provides a clean boundary for a future authentication middleware: the
`(app)` group can be protected with a Next.js `middleware.ts` matcher while `(public)` remains
open. Even though auth is out of scope for the MVP, making the structure extensible costs nothing.

## Consequences

### Positive
- Each layout is a focused server component with a single responsibility
- The public supplier form has a purposefully different visual treatment — reinforcing to
  suppliers that this is a lightweight external form, not the app itself
- Route groups are invisible in URLs — no impact on UX
- Clean extension point for future auth middleware

### Negative
- One additional folder nesting level under `src/app/`
- Developers must understand that `(app)` and `(public)` are route group names, not URL
  segments (standard Next.js knowledge)

## Implementation Notes

For the Developer agent:

### Root Layout (`src/app/layout.tsx`)

```
- Server component
- Sets <html lang="de"> (German SME target market)
- Imports global CSS
- Sets Next.js metadata (title: "GreenLedger", description)
- Renders {children} — no sidebar here
```

### Root Page (`src/app/page.tsx`)

```typescript
import { redirect } from "next/navigation"
export default function RootPage() {
  redirect("/dashboard")
}
```

### App Group Layout (`src/app/(app)/layout.tsx`)

```
- Server component
- Renders: <div class="flex h-screen">
    <Sidebar />               ← "use client" for active link state
    <main class="flex-1 overflow-y-auto p-6">
      {children}
    </main>
  </div>
```

### Public Group Layout (`src/app/(public)/public/supplier/[token]/page.tsx`)

```
- Server component (no route group layout needed — inherits root layout)
- Validates token via Prisma query
- If invalid: renders error card (no redirect)
- If valid: renders <SupplierPublicForm /> with supplier name + categories as props
```

### Sidebar Component (`src/components/layout/Sidebar.tsx`)

```
"use client"

Nav links (using next/link + usePathname for active state):
  /dashboard    → Dashboard
  /suppliers    → Suppliers
  /scope-1      → Scope 1
  /scope-2      → Scope 2
  /scope-3      → Scope 3
  /methodology  → Methodology
  /export       → Export
```

### API Routes

All Route Handlers live under `src/app/api/` — unaffected by route groups.
Route Handler files use the naming convention `route.ts` (not `page.tsx`).

```
src/app/api/
  dashboard/route.ts
  suppliers/route.ts
  suppliers/[id]/route.ts
  suppliers/[id]/refresh-token/route.ts
  scope1/route.ts
  scope1/[id]/route.ts
  scope2/route.ts
  scope2/[id]/route.ts
  scope3/categories/route.ts
  scope3/categories/[id]/route.ts
  scope3/records/route.ts
  scope3/records/[id]/route.ts
  methodology/route.ts
  methodology/[scope]/route.ts
  export/route.ts
  public/supplier/[token]/route.ts
```

### Dynamic Rendering

All app pages that fetch data must opt into dynamic rendering to prevent Next.js from
statically generating them at build time:

```typescript
export const dynamic = "force-dynamic"
```

Place this at the top of each `page.tsx` that performs database queries.
