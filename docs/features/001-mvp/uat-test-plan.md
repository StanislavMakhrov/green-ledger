# UAT Test Plan: GreenLedger MVP (001)

## Goal

Verify that the complete GreenLedger MVP — dashboard KPIs, supplier token management, public
supplier form, Scope 1/2/3 data entry, methodology notes, and PDF export — works correctly in
the running application and delivers the 5-minute demo flow described in the specification.

---

## Prerequisites

1. The application is running locally:
   ```bash
   docker run --rm -p 3000:3000 -v greenledger-data:/data green-ledger
   # or for development:
   cd src && npm run dev
   ```
2. Prisma migrations and seed data have been applied:
   ```bash
   cd src && npx prisma migrate deploy && npx prisma db seed
   ```
3. Navigate to `http://localhost:3000` in a browser.

---

## Test Steps

### Step 1: Dashboard KPI Cards

1. Navigate to `http://localhost:3000/dashboard`.
2. Observe the page.

**Verify:**

- Four KPI cards are displayed: **Scope 1**, **Scope 2**, **Scope 3**, and **Total** tCO₂e.
- All cards show numeric values (seeded data should populate them).
- The **Total** value equals Scope 1 + Scope 2 + Scope 3.
- No error messages or blank cards are shown.

---

### Step 2: Supplier List & Token Generation

1. Navigate to `http://localhost:3000/suppliers`.
2. Verify the supplier list loads (seeded suppliers should be present).
3. Click **"Generate Link"** (or equivalent button) for one of the listed suppliers.
4. Observe the tokenised URL that appears (format: `http://localhost:3000/public/supplier/[token]`).
5. Click the **"Copy"** button to copy the URL to the clipboard.

**Verify:**

- Supplier list renders with at least one row.
- "Generate Link" creates and displays a unique tokenised URL.
- The URL follows the format `/public/supplier/[uuid-token]`.
- Copy button works (URL can be pasted into address bar).

---

### Step 3: Public Supplier Form (No Authentication)

1. Open the copied tokenised URL in a **new incognito/private browser window** (to confirm no auth is needed).
2. Observe the form.
3. Enter `50000` in the **Spend (EUR)** field.
4. Submit the form.

**Verify:**

- The form loads without requiring login.
- The supplier name is displayed on the form.
- After submission, a success confirmation message is shown.
- No server error occurs.

---

### Step 4: Scope 3 Record Created via Form

1. Navigate to `http://localhost:3000/scope-3`.
2. Look for the newly created record in the records table.

**Verify:**

- A new Scope 3 record is visible with:
  - `dataSource = "supplier_form"`
  - A proxy `assumptions` note (non-empty)
  - `confidence < 1.0` (shown as a decimal or percentage)
- The record is linked to the supplier who submitted the form.

---

### Step 5: Scope 1 Manual Entry

1. Navigate to `http://localhost:3000/scope-1`.
2. Fill in the "Add Scope 1 Record" form with:
   - Period year: `2024`
   - Value (tCO₂e): `25.5`
   - Calculation method: any value
   - Emission factors source: any value
   - Data source: `manual`
3. Submit the form.

**Verify:**

- The new record appears in the Scope 1 list.
- The dashboard total for Scope 1 is updated accordingly.

---

### Step 6: Scope 2 Manual Entry

1. Navigate to `http://localhost:3000/scope-2`.
2. Add a Scope 2 record (location-based) with any valid values.

**Verify:**

- Record appears in the Scope 2 list.
- Dashboard Scope 2 total updates.

---

### Step 7: Scope 3 Category Materiality

1. Navigate to `http://localhost:3000/scope-3`.
2. Find the categories section.
3. Mark **"Purchased goods & services (C1)"** as **material** (if not already).
4. Enter a materiality reason such as "Primary source of Scope 3 emissions."
5. Save the change.

**Verify:**

- Materiality status is saved and reflected in the UI.
- The category is now flagged as material.

---

### Step 8: Methodology Notes

1. Navigate to `http://localhost:3000/methodology`.
2. Edit the Scope 3 methodology note (e.g., "Spend-based proxy using DEFRA generalised factors.").
3. Save.

**Verify:**

- Note is saved and displayed after save.
- No data loss on page reload.

---

### Step 9: PDF Export

1. Navigate to `http://localhost:3000/export`.
2. Click **"Download PDF"** (or equivalent trigger).
3. Wait for the download to complete.
4. Open the downloaded PDF.

**Verify:**

- PDF downloads without error.
- The PDF contains all five required sections in order:
  1. **Cover page** — company name and reporting year
  2. **Executive summary table** — Scope 1, Scope 2, Scope 3, Total tCO₂e
  3. **Scope 3 breakdown** — material categories only, with tCO₂e per category
  4. **Methodology section** — text from methodology notes
  5. **Assumptions & Data Quality** — lists records where `dataSource = "proxy"` OR `confidence < 1`

---

### Step 10: Invalid Supplier Token (Negative Case)

1. Manually edit the copied supplier URL in the browser, changing the token to `invalid-token-xyz`.
2. Press Enter to navigate.

**Verify:**

- The page shows a "Not found" or "Link expired" error message.
- No application crash or unhandled error page appears.

---

## Expected Results Summary

| Feature | Expected |
|---|---|
| Dashboard KPI cards | 4 cards, numeric values, Total = S1 + S2 + S3 |
| Supplier list | Renders with seeded data |
| Token generation | Unique UUID token, correct URL format |
| Public form | Accessible without login, accepts `spend_eur` |
| Scope 3 record from form | `dataSource = "supplier_form"`, `confidence < 1.0`, proxy assumptions |
| Scope 1 / Scope 2 entry | Forms work, records appear in lists |
| Category materiality | Flag saves and persists |
| Methodology notes | Save and reload without data loss |
| PDF export | Downloads, contains all 5 required sections |
| Invalid token | 404/error page, no crash |

---

## Verification Checklist

- [ ] Dashboard shows 4 KPI cards with correct totals.
- [ ] Grand total on dashboard equals sum of Scope 1 + Scope 2 + Scope 3.
- [ ] Supplier list renders with at least one row of seeded data.
- [ ] Token generation produces a unique UUID-based URL.
- [ ] Public supplier form is accessible without authentication.
- [ ] Submitting `spend_eur = 50000` creates a Scope 3 record.
- [ ] Created record has `dataSource = "supplier_form"` and `confidence < 1.0`.
- [ ] Scope 1 record can be added manually via the UI.
- [ ] Scope 2 record can be added manually via the UI.
- [ ] Scope 3 category materiality can be set and saved.
- [ ] Methodology note saves and persists across page reload.
- [ ] PDF export downloads successfully without errors.
- [ ] PDF contains cover page, summary table, Scope 3 breakdown, methodology, and assumptions sections.
- [ ] Invalid supplier token URL returns an error page (not a crash).
- [ ] No regression in navigation between pages.
