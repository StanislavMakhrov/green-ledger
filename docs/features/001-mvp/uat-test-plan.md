# UAT Test Plan: GreenLedger MVP

## Goal

Verify that the complete GreenLedger MVP demo flow works correctly in the running application,
covering all user-facing pages, the public supplier form, and PDF export.

---

## Prerequisites

```bash
# From repo root

docker compose up -d
# Wait for "Ready on http://localhost:3000", then seed data:

docker compose exec app npm run seed
```

The application should be accessible at `http://localhost:3000`.

---

## Test Steps

### Step 1: Dashboard KPI Cards

1. Navigate to `http://localhost:3000/dashboard` (or `http://localhost:3000/` — should redirect).
2. Verify four KPI cards are displayed: **Scope 1**, **Scope 2**, **Scope 3**, **Total**.
3. Confirm each card shows a numeric value in **tCO₂e** (not zero, because seed data is loaded).
4. Confirm **Total = Scope 1 + Scope 2 + Scope 3**.

**Expected Output:**

- Dashboard loads with four non-zero KPI cards.
- Values are summed correctly.
- Page loads within 3 seconds.

---

### Step 2: Supplier CRUD and Token Generation

1. Navigate to `/suppliers`.
2. Click **Add Supplier** and fill in: Name, Country, Sector, Contact Email, Status = Active.
3. Submit the form. Verify the new supplier appears in the table.
4. Click **Edit** on the new supplier, change the name, and save. Verify the name updates.
5. Click **Generate / Refresh Token** for the supplier. Verify a tokenised URL appears.
6. Click **Copy Link**. Verify a confirmation (e.g., "Copied!") is shown.
7. Click **Delete** on the supplier and confirm. Verify it disappears from the table.

**Expected Output:**

- Supplier CRUD works end-to-end with no errors.
- A valid URL in the format `http://localhost:3000/public/supplier/<token>` is generated.

---

### Step 3: Public Supplier Form (Spend-Based Proxy)

1. From `/suppliers`, click **Generate Token** for an existing (seeded) supplier and copy the link.
2. Open the link in an **incognito / private browsing window** (simulates unauthenticated access).
3. Verify the page loads with no authentication prompt and shows the supplier's name and a minimal form.
4. Enter `spend_eur: 5000` (leave `ton_km` and `waste_kg` blank).
5. Submit the form.
6. Verify a success confirmation message is displayed.

**Expected Output:**

- Form is accessible without login.
- Submission succeeds and shows confirmation.
- No 404 or auth error.

---

### Step 4: Scope 3 Record Created from Form Submission

1. After completing Step 3, navigate to `/scope-3` in the main app.
2. In the **Records** section, find the record created by the supplier form submission.
3. Verify the record shows:

   - Supplier name matching the form supplier.
   - Category: **Purchased Goods & Services (C1)**.
   - `dataSource`: `supplier_form`.
   - `confidence` value **less than 1** (proxy used).
   - Non-empty `assumptions` text.
   - `valueTco2e` ≈ `5000 × 0.4 / 1000 = 2.0 tCO₂e` (or per configured PROXY_FACTOR conversion).

**Expected Output:**

- Record exists with correct supplier, category, dataSource, confidence < 1, and correct calculated value.

---

### Step 5: Scope 1 and Scope 2 Record Management

1. Navigate to `/scope-1`. Click **Add Record**.
2. Fill in: Period Year = 2024, Value (tCO₂e) = 50, Calculation Method = "Direct combustion", Emission Factor Source = "DEFRA 2023".
3. Submit. Verify the record appears in the list.
4. Navigate to `/scope-2`. Repeat with Value = 80.
5. Return to `/dashboard`. Verify the Scope 1 and Scope 2 KPI totals have increased.

**Expected Output:**

- Records can be added to both scopes.
- Dashboard totals reflect the new additions.

---

### Step 6: Scope 3 Category Materiality

1. Navigate to `/scope-3`.
2. In the **Categories** section, find a category (e.g., C1 Purchased Goods & Services).
3. Toggle **Material** to true and enter a materiality reason (e.g., "Largest emission source").
4. Save/confirm the change.
5. Toggle a different category to **non-material**.
6. Verify the changes persist after a page refresh.

**Expected Output:**

- Materiality and reason are saved and visible after refresh.

---

### Step 7: Methodology Notes

1. Navigate to `/methodology`.
2. Edit the **Scope 3** methodology note (e.g., "Spend-based proxy applied using DEFRA EF.").
3. Save the note.
4. Refresh the page.
5. Verify the note text is preserved.

**Expected Output:**

- Methodology notes save correctly for all three scopes.

---

### Step 8: PDF Export

1. Navigate to `/export`.
2. Click **Download PDF Report**.
3. Wait for the PDF to generate (should complete within 10 seconds).
4. Open the downloaded PDF and verify it contains **all five required sections**:

   | Section | What to Look For |
   |---------|-----------------|
   | **Cover page** | Company name and reporting year |
   | **Summary table** | Scope 1, Scope 2, Scope 3, Total in tCO₂e |
   | **Scope 3 breakdown** | Table with material categories only; note about non-material categories if any exist |
   | **Methodology section** | Text matching the methodology notes edited in Step 7 |
   | **Assumptions & Data Quality** | Row for the proxy record from Step 3 (showing supplier, assumptions, confidence < 1, dataSource) |

**Expected Output:**

- PDF downloads successfully within 10 seconds.
- All five sections present and correct.
- Proxy record from Step 3 appears in the Assumptions section.

---

## Expected Results Summary

| Feature | Expected Behaviour |
|---------|-------------------|
| Dashboard | Shows non-zero KPI cards; Total = S1 + S2 + S3; loads < 3 s |
| Supplier CRUD | Create, edit, delete work without errors |
| Token generation | Produces valid `/public/supplier/<token>` URL |
| Copy link | Clipboard feedback shown |
| Public form | Accessible unauthenticated; accepts spend/transport/waste fields |
| Proxy calculation | `valueTco2e = spend_eur × PROXY_FACTOR`; confidence < 1; assumptions populated |
| Scope 3 record | Created after form submit with correct supplier, category, dataSource |
| Scope 1/2 records | Add/list works; dashboard updates |
| Category materiality | Toggle persists after refresh |
| Methodology notes | Text saves per scope; persists after refresh |
| PDF export | Binary download < 10 s; all five sections present |

---

## Verification Checklist

- [ ] Dashboard displays Scope 1, Scope 2, Scope 3, and Total KPI cards with values from seed data
- [ ] Dashboard Total equals the sum of the three scopes
- [ ] Supplier can be created, edited, and deleted
- [ ] Token generation produces a correctly formatted public form URL
- [ ] Public supplier form is accessible in an unauthenticated browser window
- [ ] Supplier form submission with `spend_eur` succeeds and shows confirmation
- [ ] Scope 3 record is created with `confidence < 1`, `dataSource = "supplier_form"`, correct `valueTco2e`
- [ ] Scope 1 and Scope 2 records can be manually added
- [ ] Dashboard KPIs update after adding Scope 1/2 records
- [ ] Scope 3 category materiality can be toggled and saved
- [ ] Methodology notes save and persist for all three scopes
- [ ] PDF downloads within 10 seconds
- [ ] PDF contains cover page, summary table, Scope 3 breakdown, methodology section, and assumptions section
- [ ] Assumptions section in PDF includes the proxy record (confidence < 1) from the supplier form submission
- [ ] No console errors or unhandled exceptions during any of the above steps
- [ ] Application runs correctly after a full `docker compose down && docker compose up -d && npm run seed`
