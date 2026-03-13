# UAT Test Plan: Export Suppliers to Excel

## Goal

Verify that the "Export to Excel" feature works correctly in the running app:
clicking the button downloads a valid `.xlsx` file containing all supplier
records with the correct columns, filename, and sort order.

---

## Test Steps

### Step 1: Verify Button Presence on Suppliers Page

1. Run the app: `docker compose up -d` (or pull the PR image and run it)
2. Navigate to `http://localhost:3000/suppliers`
3. Look at the toolbar area at the top-right of the supplier list

**Verify:**
- An **"⬇ Export to Excel"** button or link is visible next to the **"+ Add Supplier"** button
- The button is styled consistently with the existing secondary button style (white background, gray border)

---

### Step 2: Download and Inspect the Excel File

1. Click **"⬇ Export to Excel"** on the Suppliers page
2. The browser should prompt a file download (no error page should appear)
3. Save the file and open it in Microsoft Excel or LibreOffice Calc

**Verify:**
- The filename follows the pattern `greenledger-suppliers-YYYY-MM-DD.xlsx` (today's date)
- The file opens without warnings or repair prompts
- Row 1 is a header row with exactly these column names (in any order):
  - `Name`
  - `Country`
  - `Sector`
  - `Contact Email`
  - `Status`
- There is **no** column named `publicFormToken` (or any UUID-looking column)
- Each seeded supplier from the app appears as exactly one data row
- Rows are sorted **A–Z by Name**
- The `Status` column contains plain text values: `active` or `inactive`

---

### Step 3: Confirm Audit Log Entry

1. Navigate to any audit-visible area (if available in the UI), or check the
   database/logs to confirm an audit record was created
2. (Optional) Export again and verify a second audit entry is added

**Verify:**
- An audit event with action `exported` was logged for the XLSX export

---

### Step 4: Edge Case — Export with No Suppliers (if feasible)

> Skip this step if resetting the database is not practical in the UAT environment.

1. Remove all suppliers (or use a clean seed without suppliers)
2. Navigate to `http://localhost:3000/suppliers`
3. Click **"⬇ Export to Excel"**
4. Open the downloaded file

**Verify:**
- File downloads without error
- File contains only the header row (no data rows)
- No error message appears in the browser

---

## Expected Results

- **Button visible**: "⬇ Export to Excel" appears in the Suppliers toolbar at all times
- **File downloads**: Browser triggers download with `.xlsx` extension and date-stamped name
- **Correct columns**: Header row has exactly `Name`, `Country`, `Sector`, `Contact Email`, `Status`
- **No security leak**: `publicFormToken` column is absent
- **Correct data**: All suppliers from the app appear in the file, sorted A–Z by name
- **Empty state**: Zero suppliers → header-only file, no error
- **No regressions**: Existing supplier list, add-supplier form, and other pages are unaffected

---

## Verification Checklist

- [ ] "Export to Excel" button is visible on the Suppliers page
- [ ] Button is positioned next to the "+ Add Supplier" button
- [ ] Clicking the button triggers a file download (no error page)
- [ ] Downloaded filename matches `greenledger-suppliers-YYYY-MM-DD.xlsx`
- [ ] File opens correctly in Excel / LibreOffice Calc
- [ ] Row 1 is a header with: Name, Country, Sector, Contact Email, Status
- [ ] `publicFormToken` column is **absent**
- [ ] All seeded suppliers appear (one row each), sorted A–Z by name
- [ ] Status values are plain text (`active` / `inactive`)
- [ ] Audit event is created for the export action
- [ ] Add Supplier and other Supplier-page functionality still works normally
