# ADR-004: Supplier Public Form Access via Token URL

## Status

Accepted

## Context

Suppliers must be able to submit activity data (spend, transport, waste) through a public web form without creating a user account or logging in. The form URL must be shareable by email or messaging — the application user copies the link from the `/suppliers` page and sends it to the supplier contact.

Requirements:
- The form must be accessible to anyone who has the URL — no authentication challenge.
- Each supplier must have a distinct URL so that submissions are automatically associated with the correct supplier record.
- The token must be revocable (re-generating a new token should invalidate the old URL).
- The system must protect against accidental cross-supplier submissions (i.e., a token must unambiguously identify exactly one supplier).
- No user account creation, email verification, or password management is in scope.

## Decision

Store a **random UUID token** (`publicFormToken`) on each `Supplier` record and use it as the URL path segment for the public form:

- **URL pattern:** `/public/supplier/[token]`
- **API endpoint:** `POST /api/public/supplier/[token]`
- **Token generation:** `crypto.randomUUID()` — a cryptographically random 36-character UUID (Version 4).
- **Token storage:** `Supplier.publicFormToken` — unique, indexed column in the database.
- **Token refresh:** `POST /api/suppliers/[id]/token` — generates a new UUID and overwrites `publicFormToken`. Old tokens immediately become invalid (404 on form load).
- **Token exposure:** The token appears only in the URL. It is never embedded in the page source, never sent to analytics, and never included in audit trail comments.
- **Supplier lookup:** On form submission, the Route Handler does `prisma.supplier.findUnique({ where: { publicFormToken: token } })`. If not found (invalid/expired token), returns HTTP 404.

### Token generation flow

```
User clicks "Generate Link" on /suppliers
  → POST /api/suppliers/[id]/token
  → Server: supplier.publicFormToken = crypto.randomUUID()
  → Server: saves to database
  → Returns { token, url: `/public/supplier/${token}` }
  → Client copies URL to clipboard
```

### Submission flow

```
Supplier opens /public/supplier/[token]
  → Server component looks up Supplier by publicFormToken
  → If not found: renders 404 page
  → If found: renders submission form with supplier name
Supplier submits form data (spend_eur / ton_km / waste_kg)
  → POST /api/public/supplier/[token]
  → Server: validates input, applies proxy calculation if needed
  → Server: creates Scope3Record (dataSource = "supplier_form")
  → Server: creates AuditTrailEvent (action = "submitted", actor = "supplier")
  → Returns success response
```

## Rationale

A random UUID token in the URL is the simplest secure pattern for one-time or limited-use form access:

- **Security by obscurity (sufficient for demo):** A 128-bit UUID has ~5.3 × 10³⁸ possible values. Brute-force enumeration is computationally infeasible. This is the same mechanism used by calendar invite links, file sharing links, and similar "capability URL" patterns.
- **No infrastructure overhead:** No OTP delivery (email/SMS), no session store, no JWT signing keys, no TOTP seeds. Token validation is a single indexed database lookup.
- **Revocable:** Refreshing the token via the API immediately invalidates the old URL. The application user can regenerate a token if a supplier's contact changes or if the old link is compromised.
- **Unambiguous supplier association:** The token is the foreign key to the supplier. There is no ambiguity about which supplier submitted data.
- **Audit trail:** Every submission creates an `AuditTrailEvent` with `actor = "supplier"` and `entityId` pointing to the created `Scope3Record`, providing a clear audit trail without requiring supplier identity.

This pattern is sometimes called a "magic link" or "capability URL" and is widely used in production systems for low-stakes, unauthenticated access (e.g., unsubscribe links, public form submissions, survey links).

## Alternatives Considered

### Alternative A: Email OTP (one-time password sent to supplier's email)

Generate a short-lived code sent to `Supplier.contactEmail` when the application user triggers a submission request.

**Pros:** Higher assurance that the submitter controls the supplier's email address.  
**Cons:** Requires an email delivery service (SMTP/SES/SendGrid), adds latency (email delivery), requires the supplier to have access to the email inbox at the time of submission, complicates the demo flow significantly. Out of scope for MVP (no auth/RBAC, no external service integrations).

**Rejected** as out of scope for the MVP.

### Alternative B: Short-lived JWT in URL

Generate a JWT signed with a server secret, embedded in the URL, with an expiry claim.

**Pros:** Stateless validation (no database lookup to verify validity); includes expiry without a database flag.  
**Cons:** JWTs in URLs can be accidentally cached, logged by proxies, or leaked in `Referer` headers. Managing signing key rotation adds operational complexity. For a demo with no hosted deployment, a database-backed UUID is simpler and sufficient. Revoking a JWT requires a denylist (defeating the stateless advantage).

**Rejected** in favour of simpler UUID token with database-backed revocation.

### Alternative C: Shared password or PIN

Display a form-level password that the application user communicates to the supplier.

**Pros:** Simple, no token storage needed.  
**Cons:** Passwords are shared secrets that can be reused across suppliers, are harder to revoke per-supplier, and provide no automatic supplier association on submission. The user experience is worse than a direct link.

**Rejected** because token URLs are strictly easier for suppliers (one click, no password entry) and provide automatic supplier identification.

### Alternative D: No token — open public form with supplier selection

A single public form URL where the supplier selects themselves from a dropdown.

**Pros:** Simplest implementation — no token management.  
**Cons:** Exposes the full supplier list to any visitor. Allows any person to submit data on behalf of any supplier. Provides no protection against cross-supplier data pollution. Unacceptable even for a demo.

**Rejected** due to unacceptable data integrity risk.

## Consequences

### Positive

- Zero authentication infrastructure required — suppliers access forms via a shareable URL.
- Token lookup is a single indexed database query (`publicFormToken` has a `@unique` constraint).
- Tokens are immediately revocable by the application user.
- Each submission is unambiguously linked to a specific supplier record.
- The pattern is familiar to end users (magic links, calendar invites, file share links).

### Negative

- Anyone who obtains the URL can submit data. This is acceptable for a demo but would need additional controls (rate limiting, CAPTCHA, or authentication) in a production deployment.
- Token URLs can be accidentally forwarded by a supplier contact to a third party. Mitigated by token refresh capability and audit trail review.
- The `publicFormToken` column must have a `@unique` index; collision probability with UUID v4 is negligible (~10⁻³⁷ for 10 billion tokens) but theoretically non-zero. The application must handle the unique constraint violation on generation (retry with a new UUID).
