"""
Selenium smoke tests for Export Suppliers to Excel — Feature 003.

Drives a headless Chrome browser against the app at BASE_URL.
Covers all user-facing scenarios from the UAT test plan:

  TC-11  "⬇ Export to Excel" button/link is visible on /suppliers page
  TC-12  Navigating to /api/export/suppliers/xlsx returns a file (no error page)
"""

import pytest
import requests
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def navigate(driver, base_url: str, path: str) -> None:
    """Navigate to a URL and wait for the page to finish loading."""
    driver.get(f"{base_url}{path}")
    WebDriverWait(driver, 15).until(
        lambda d: d.execute_script("return document.readyState") == "complete"
    )


def assert_no_server_error(driver) -> None:
    """Assert the page does not show a Next.js error boundary."""
    body_text = driver.find_element(By.TAG_NAME, "body").text.lower()
    assert "application error" not in body_text, "Page shows application error"
    assert "500" not in driver.title, "Page title indicates 500 error"


# ---------------------------------------------------------------------------
# TC-11: Export button visible on /suppliers page
# ---------------------------------------------------------------------------

class TestExportButtonVisibility:
    def test_export_button_is_visible_on_suppliers_page(self, driver, base_url):
        """TC-11: '⬇ Export to Excel' link/button must be visible on /suppliers."""
        navigate(driver, base_url, "/suppliers")
        assert_no_server_error(driver)

        # Wait for the main content area to load
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.TAG_NAME, "main"))
        )

        # Look for an anchor pointing to the XLSX export endpoint
        export_link = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((
                By.XPATH,
                "//a[contains(@href, '/api/export/suppliers/xlsx')]"
            ))
        )
        assert export_link.is_displayed(), (
            "'⬇ Export to Excel' element is present in DOM but not visible"
        )

    def test_export_link_points_to_correct_endpoint(self, driver, base_url):
        """TC-11 (detail): The export link href must point to the XLSX endpoint."""
        navigate(driver, base_url, "/suppliers")
        assert_no_server_error(driver)

        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.TAG_NAME, "main"))
        )

        # Find anchor tags that reference the export endpoint
        anchors = driver.find_elements(
            By.XPATH,
            "//a[contains(@href, '/api/export/suppliers/xlsx')]"
        )
        assert len(anchors) > 0, (
            "No <a> element found with href containing '/api/export/suppliers/xlsx'"
        )
        assert anchors[0].is_displayed(), (
            "Export anchor is present but not visible"
        )


# ---------------------------------------------------------------------------
# TC-12: Clicking / navigating to the export endpoint returns a file
# ---------------------------------------------------------------------------

class TestExportEndpoint:
    def test_export_endpoint_returns_xlsx_content_type(self, base_url):
        """TC-12: GET /api/export/suppliers/xlsx must return HTTP 200 and XLSX content-type."""
        url = f"{base_url}/api/export/suppliers/xlsx"
        response = requests.get(url, timeout=15)
        assert response.status_code == 200, (
            f"Expected HTTP 200 from {url}, got {response.status_code}"
        )
        content_type = response.headers.get("Content-Type", "")
        assert "spreadsheetml" in content_type or "octet-stream" in content_type, (
            f"Unexpected Content-Type: {content_type!r}. "
            "Expected an XLSX (spreadsheetml) or binary (octet-stream) response."
        )

    def test_export_endpoint_returns_nonempty_file(self, base_url):
        """TC-12 (detail): The XLSX response body must be non-empty."""
        url = f"{base_url}/api/export/suppliers/xlsx"
        response = requests.get(url, timeout=15)
        assert response.status_code == 200, (
            f"Expected HTTP 200, got {response.status_code}"
        )
        assert len(response.content) > 0, "XLSX response body is empty"

    def test_export_endpoint_filename_header(self, base_url):
        """TC-12 (detail): Content-Disposition must suggest a .xlsx filename."""
        url = f"{base_url}/api/export/suppliers/xlsx"
        response = requests.get(url, timeout=15)
        assert response.status_code == 200, (
            f"Expected HTTP 200, got {response.status_code}"
        )
        disposition = response.headers.get("Content-Disposition", "")
        assert ".xlsx" in disposition, (
            f"Content-Disposition header does not contain '.xlsx': {disposition!r}"
        )

    def test_navigating_to_export_url_does_not_show_error_page(self, driver, base_url):
        """TC-12 (browser): Navigating to the export endpoint must not show an error page."""
        navigate(driver, base_url, "/api/export/suppliers/xlsx")
        body_text = driver.find_element(By.TAG_NAME, "body").text.lower()
        # The browser may show a download prompt or a blank page — not an error page
        assert "application error" not in body_text, (
            "Export endpoint shows application error in browser"
        )
        assert "not found" not in body_text, (
            "Export endpoint shows 'not found' — route may be missing"
        )
        assert "internal server error" not in body_text, (
            "Export endpoint shows internal server error"
        )
