# UAT Test Plan: Supplier Selection and Excel Export (Feature 003)

## Goal

Verify that supplier checkbox selection and Excel export work correctly in the running app:
users can select one or more suppliers from the `/suppliers` page and download a properly
formatted `.xlsx` file containing only the selected suppliers' data.

---

## Test Steps

### Step 1: Initial Page State — Checkboxes and Disabled Export Button

1. Run the app: `docker compose up -d`
2. Open `http://localhost:3000/suppliers` in a browser
3. Verify the suppliers table has a **new leftmost column** containing checkboxes
4. Verify the table **header row** has a "Select All" checkbox with an accessible label
   (inspect element: `aria-label="Select all suppliers"`)
5. Verify each supplier row has a row checkbox with `aria-label="Select <supplier name>"`
6. Verify the **"Export to Excel"** button is visible in the page header (near "+ Add Supplier")
7. Verify the export button is **disabled / greyed out** with no suppliers selected
8. Verify a selection counter is visible showing **"0 selected"** (or "0 supplier(s) selected")

### Step 2: Select One Supplier

1. Click the checkbox on **one** supplier row
2. Verify the selected row is **visually highlighted** (e.g., light green/blue background)
3. Verify the selection counter updates to **"1 selected"** (or "1 supplier(s) selected")
4. Verify the **"Export to Excel" button is now enabled** (not greyed out, clickable)
5. Verify the **header "Select All" checkbox** shows an **indeterminate** state (dash or
   partial fill — not fully checked, not empty)

### Step 3: Export One Supplier

1. With one supplier selected, click **"Export to Excel"**
2. Verify the button briefly shows a loading state (e.g., "Exporting…") and is disabled
   during the request
3. Verify the browser initiates a **file download** without a page reload
4. Verify the downloaded filename matches: `suppliers-export-YYYY-MM-DD.xlsx`
   (where the date is today's date, e.g., `suppliers-export-2025-07-15.xlsx`)
5. Open the downloaded file in Excel, LibreOffice Calc, or Google Sheets
6. Verify the **first row contains headers**: `Name | Country | Sector | Contact Email | Status`
7. Verify there is **exactly one data row** matching the selected supplier's details
8. Verify the row data is accurate (matches what is shown in the UI table)

### Step 4: Select All Suppliers and Export

1. Click the **"Select All" checkbox** in the table header
2. Verify **all rows are highlighted**
3. Verify the selection counter shows the **total supplier count**
4. Verify the header checkbox is now **fully checked** (not indeterminate)
5. Click **"Export to Excel"**
6. Open the downloaded `.xlsx` file
7. Verify the file contains **one data row per supplier** (row count equals the number shown
   in the UI, excluding the header row)

### Step 5: Deselect All

1. While all suppliers are selected, click the **"Select All" checkbox** again
2. Verify **all rows are deselected** (no highlights)
3. Verify the selection counter returns to **"0 selected"**
4. Verify the **"Export to Excel" button is disabled again**

### Step 6: Partial Selection — Indeterminate State

1. Select exactly **one supplier** from a list with multiple suppliers
2. Inspect the **header "Select All" checkbox** — it should appear **indeterminate**
   (a dash, or a partially-filled state, depending on the browser/OS)
3. Click the header checkbox to select all
4. Click it again to deselect all
5. Confirm the indeterminate state appears correctly only when a strict subset is selected

### Step 7: Error Case — No Selection Guard

1. Ensure no suppliers are selected
2. Attempt to programmatically trigger the export button via browser DevTools:

   ```js
   document.querySelector('[data-testid="export-button"]')?.click()
   // or find the button by text and dispatch a click event
   ```

3. Verify an **inline message** appears: _"Please select at least one supplier to export."_
4. Verify **no file download** is triggered

### Step 8: Regression — Existing Supplier Actions Still Work

1. Navigate to `/suppliers`
2. Add a new supplier using the **"+ Add Supplier"** button — verify it saves successfully
3. Toggle the **active/inactive status** of an existing supplier — verify the change persists
4. Use **"Copy Form Link"** on a supplier — verify the link is copied
5. Delete a supplier — verify it is removed from the list
6. Verify the selection state is **cleared** after any data reload action (add/delete/token
   refresh should reset the selection)

---

## Expected Results

- **Initial state**: Export button disabled, no rows highlighted, counter shows 0
- **After selecting rows**: Matching rows highlighted, counter updates, button enabled
- **After "Select All"**: All rows highlighted, counter equals total supplier count, header
  checkbox fully checked
- **Downloaded file**: Named `suppliers-export-YYYY-MM-DD.xlsx`, worksheet titled "Suppliers",
  headers in row 1, one data row per selected supplier
- **Deselect all**: Highlights cleared, counter back to 0, button disabled
- **Indeterminate state**: Header checkbox shows dash/partial state when partial selection
- **No-selection guard**: Inline error message shown, no download triggered
- **Regression**: All pre-existing supplier actions still work normally

---

## Verification Checklist

- [ ] Checkbox column appears as the leftmost column in the suppliers table
- [ ] "Select All" header checkbox has `aria-label="Select all suppliers"`
- [ ] Individual row checkboxes have `aria-label="Select <supplier name>"`
- [ ] "Export to Excel" button is disabled when 0 suppliers are selected
- [ ] "Export to Excel" button is enabled when ≥ 1 supplier is selected
- [ ] Selected rows are visually highlighted (background tint)
- [ ] Selection counter accurately reflects the number of selected suppliers
- [ ] Header checkbox enters indeterminate state when a partial subset is selected
- [ ] Header "Select All" selects all rows in one click
- [ ] Header "Select All" (when all selected) deselects all rows in one click
- [ ] Clicking "Export to Excel" triggers a browser download (no page reload)
- [ ] Downloaded filename matches `suppliers-export-YYYY-MM-DD.xlsx`
- [ ] Downloaded file contains header row: Name, Country, Sector, Contact Email, Status
- [ ] Downloaded file contains exactly one row per selected supplier
- [ ] Non-selected suppliers do NOT appear in the exported file
- [ ] Exporting all suppliers produces a file with every supplier row
- [ ] Button shows loading state during export and re-enables on completion
- [ ] Inline error message shown when export attempted with no selection
- [ ] Existing supplier CRUD and token actions are unaffected
- [ ] Selection is cleared after add/delete/token-refresh reloads data
