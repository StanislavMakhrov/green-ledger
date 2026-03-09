# UAT Test Plan: GreenLedger MVP

**Feature:** 001-mvp  
**Type:** User Acceptance Testing  
**Scope:** All 8 user-facing pages + end-to-end demo flow

---

## Prerequisites

1. Start the application locally:
   ```bash
   docker compose up -d
   ```
   Or for development:
   ```bash
   cd src && npm run db:push && npm run db:seed && npm run dev
   ```
2. Open a browser at **http://localhost:3000**
3. The seed data must be loaded (Musterfirma GmbH, 3 suppliers, Scope 1/2/3 records)

---

## End-to-End Demo Flow (5-minute smoke path)

Work through these steps in order — they mirror the MVP demo described in `docs/spec.md`.

| Step | Action | Expected Result |
|------|--------|----------------|
| E-01 | Navigate to **http://localhost:3000** | Automatically redirects to `/dashboard` |
| E-02 | Observe the Dashboard KPI cards | Four cards visible: Scope 1, Scope 2, Scope 3, Total — all show non-zero tCO₂e values for 2024 |
| E-03 | Click **Suppliers** in the sidebar | Supplier list page loads; 3 suppliers from seed are shown (Zulieferer Alpha, Logistics Partner Beta, Gamma Verpackungen) |
| E-04 | Click the copy-link icon/button next to **Zulieferer Alpha GmbH** | A public form URL is copied to clipboard (contains `/public/supplier/`) |
| E-05 | Paste the URL in a new tab and open it | Supplier form page loads with supplier name and no sidebar navigation |
| E-06 | Fill in **Spend (EUR)** = `10000` and click **Submit** | Success confirmation message shown; no error |
| E-07 | Return to the app tab, navigate to **Scope 3** | New Scope 3 record appears (supplier: Zulieferer Alpha, dataSource: supplier_form or proxy, confidence: 0.5) |
| E-08 | Navigate to **Export** and click **Download CSRD Climate Report** | PDF file download is triggered; file opens and contains all 5 sections |

---

## Page-by-Page Verification

### UAT-01: Dashboard (`/dashboard`)

| ID | Check | Expected |
|----|-------|----------|
| D-01 | Page loads without error | No crash or 500 error; KPI cards render |
| D-02 | Scope 1 total shown | Positive numeric value (tCO₂e), seeded records sum ≈ 58.0 |
| D-03 | Scope 2 total shown | Positive numeric value (tCO₂e), seeded record ≈ 38.5 |
| D-04 | Scope 3 total shown | Positive numeric value (tCO₂e), seeded records sum ≈ 136.7 |
| D-05 | Grand total = S1 + S2 + S3 | Grand total card value equals the sum of the three scope cards |
| D-06 | Reporting year label displayed | Year "2024" visible on page or in card headers |

### UAT-02: Suppliers (`/suppliers`)

| ID | Check | Expected |
|----|-------|----------|
| S-01 | Supplier list loads | 3 seed suppliers shown |
| S-02 | Add supplier form | Clicking "Add" / "New Supplier" opens a form |
| S-03 | Create a new supplier | Fill name, country, sector, email → Save → New entry appears in list |
| S-04 | Edit a supplier | Click edit on any supplier → Modify a field → Save → Change reflected in list |
| S-05 | Soft-delete a supplier | Click delete/deactivate → Supplier status changes to inactive or is hidden |
| S-06 | Copy public form link | Click copy button → URL is placed on clipboard (should contain the token) |
| S-07 | Refresh token | Click "Refresh token" → A new token is generated; old URL is now invalid |

### UAT-03: Scope 1 (`/scope-1`)

| ID | Check | Expected |
|----|-------|----------|
| SC1-01 | Page loads with seeded records | 2 records shown from seed |
| SC1-02 | Add a Scope 1 record | Fill periodYear, valueTco2e, calculationMethod, emissionFactorsSource → Save → Record appears in list |
| SC1-03 | Validation — empty form | Attempting to save empty form shows field errors or is blocked |

### UAT-04: Scope 2 (`/scope-2`)

| ID | Check | Expected |
|----|-------|----------|
| SC2-01 | Page loads with seeded records | 1 record shown from seed |
| SC2-02 | Add a Scope 2 record | Same form as Scope 1 → Save → Record appears in list |

### UAT-05: Scope 3 (`/scope-3`)

| ID | Check | Expected |
|----|-------|----------|
| SC3-01 | Categories panel shows all 15 GHG Protocol categories | C1–C15 listed; C1 and C4 marked material |
| SC3-02 | Toggle materiality | Click material toggle on C2 → Save/auto-save → C2 now shows as material |
| SC3-03 | Add materialityReason | Edit materialityReason for a category → Save → Reason persists on reload |
| SC3-04 | Records panel shows seeded records | 3 seed records visible with supplier name, category, tCO₂e, confidence |
| SC3-05 | Add a Scope 3 record manually | Fill required fields → Save → Record appears in list |

### UAT-06: Methodology (`/methodology`)

| ID | Check | Expected |
|----|-------|----------|
| M-01 | Three text areas shown | One each for Scope 1, Scope 2, Scope 3; pre-populated from seed |
| M-02 | Edit and save a note | Modify text in any scope area → Save → On page reload, updated text persists |

### UAT-07: Export (`/export`)

| ID | Check | Expected |
|----|-------|----------|
| EX-01 | Export page loads | "Download CSRD Climate Report" button visible |
| EX-02 | Download triggers a PDF file | Browser downloads a `.pdf` file; no 500 error |
| EX-03 | PDF — Cover page | Contains company name (Musterfirma GmbH) and reporting year (2024) |
| EX-04 | PDF — Summary table | Shows Scope 1, Scope 2, Scope 3, Total rows with numeric values |
| EX-05 | PDF — Scope 3 breakdown | Contains entries for material categories (C1, C4); non-material note present |
| EX-06 | PDF — Methodology section | Text from methodology notes appears; one section per scope |
| EX-07 | PDF — Assumptions & Data Quality | Lists proxy/low-confidence records with supplier, category, confidence, assumptions |

### UAT-08: Public Supplier Form (`/public/supplier/[token]`)

| ID | Check | Expected |
|----|-------|----------|
| PF-01 | Valid token shows form | Supplier name displayed; form fields visible; no sidebar |
| PF-02 | Invalid token shows error | Navigate to `/public/supplier/invalid-token` → Error message displayed |
| PF-03 | Submit spend only | Enter `spend_eur` value, leave other fields blank → Submit succeeds |
| PF-04 | Submit transport data | Enter `ton_km` value → Submit succeeds |
| PF-05 | Submit waste data | Enter `waste_kg` value → Submit succeeds |
| PF-06 | Submit with no data | Leave all fields blank → Inline validation error: "Please enter at least one activity value" |
| PF-07 | Success confirmation | After valid submit, page shows success message |
| PF-08 | Record created in Scope 3 | After submit, navigate to `/scope-3` in main app → New record with confidence 0.5 appears |

---

## Pass / Fail Criteria

**PASS** — All E-01–E-08 end-to-end steps succeed, AND all page-specific checks in UAT-01 through UAT-08 pass.

**FAIL** — Any step fails. Record:
- The UAT ID (e.g. `PF-06`)
- What was expected vs what actually happened
- Screenshot if possible

---

## UAT Report

After testing, create `docs/features/001-mvp/uat-report.md` with:

```markdown
# UAT Report: GreenLedger MVP

**Date:** YYYY-MM-DD
**Tester:** [Maintainer name]
**Result:** PASS | FAIL

## Issues Found
(if any — UAT ID, description, severity)

## Sign-off
[ ] Ready to release
```
