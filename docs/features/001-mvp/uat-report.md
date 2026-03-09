# UAT Report — GreenLedger MVP (001-mvp)

**Date:** 2026-03-09
**Branch:** `copilot/implement-green-ledger-mvp`
**Environment:** Docker image built from `src/Dockerfile`, run via `docker compose up`
**Result:** ✅ PASS

---

## Test Environment

- Docker image built locally from branch
- Container started with `docker compose up -d`
- Seed ran automatically on startup (`tsx prisma/seed.ts`) — demo data pre-loaded
- App accessible at `http://localhost:3000`

---

## Verification Results

| # | Feature | Expected | Result |
|---|---------|----------|--------|
| 1 | Dashboard KPI cards | Scope 1/2/3/Total tCO₂e displayed for Demo GmbH | ✅ Pass |
| 2 | Sidebar navigation | All 7 links present and functional | ✅ Pass |
| 3 | Suppliers list | Demo supplier shown with Copy Link / Refresh Token / Delete | ✅ Pass |
| 4 | Add Supplier form | Form rendered with Name/Country/Sector/Email fields | ✅ Pass |
| 5 | Scope 3 categories | 15 ESRS categories listed, C1 and C4 marked Material | ✅ Pass |
| 6 | Scope 3 materiality reasons | Reasons shown for material categories | ✅ Pass |
| 7 | Public supplier form | Token-gated form renders with supplier name, 3 input fields | ✅ Pass |
| 8 | Export page | PDF download button rendered, report description shown | ✅ Pass |
| 9 | Scope 1 page | Add Record form + empty table rendered | ✅ Pass |
| 10 | Docker seed | `Seed complete.` in container logs on first start | ✅ Pass |

---

## Screenshots

### Dashboard — KPI cards (Scope 1: 120.50, Scope 2: 85.20, Total: 205.70 tCO₂e)
![Dashboard](https://github.com/user-attachments/assets/8cf5dc6a-0e7b-49da-b215-fd12eb1cb475)

### Suppliers — CRUD table with tokenized form link
![Suppliers](https://github.com/user-attachments/assets/e4ec6fc7-f7ab-4557-9bcf-f51fb82eecbb)

### Public Supplier Form — token-gated, no sidebar
![Public Supplier Form](https://github.com/user-attachments/assets/37614234-525e-4ec9-bae4-499184aa3127)

### Scope 3 — Categories & Materiality table
![Scope 3](https://github.com/user-attachments/assets/bc4da902-670c-4f15-9ed6-67c7996d7d9d)

### Export — PDF download page
![Export](https://github.com/user-attachments/assets/b2603287-a8df-4033-a004-e28319bea35f)

---

## Issues Found During UAT

Two bugs were found and fixed as part of this UAT run:

1. **`prisma db seed` was a no-op in Docker** — `prisma.config.ts` was missing the `seed` command, and `prisma/seed.ts` used a Next.js `@/` path alias that `ts-node` could not resolve. Fixed by installing `tsx`, adding `seed: 'tsx prisma/seed.ts'` to `prisma.config.ts`, updating the `package.json` seed script, and changing the import to a relative path (`../app/generated/prisma/client`).

2. **UAT workflow required manual trigger** — `uat.yml` was `workflow_dispatch`-only. Replaced with an automated Docker build + push to GHCR in `pr-validation.yml`, so every PR push produces a pullable image.

---

## UAT Instructions (for future PRs)

After every PR push, `PR Validation` automatically builds and pushes a Docker image to GHCR. To run UAT:

```bash
docker pull ghcr.io/stanislavmakhrov/green-ledger:pr-<number>
docker run --rm -p 3000:3000 ghcr.io/stanislavmakhrov/green-ledger:pr-<number>
```

Then open **http://localhost:3000**. Demo data is seeded automatically on first start.
