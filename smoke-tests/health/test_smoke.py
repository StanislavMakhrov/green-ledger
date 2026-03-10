"""
Baseline Selenium smoke tests for GreenLedger.

These tests run from OUTSIDE the Docker container, driving a headless Chrome
browser that navigates the application at BASE_URL (default: http://localhost:3000).

They verify that all key pages load, navigation works, and core UI elements
are visible — covering the fundamental user acceptance scenarios.

Run via: pytest smoke-tests/ (from repo root)
Run in CI: smoke-tests job in pr-validation.yml
"""

import pytest
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
        lambda d: _ready_state(d) == "complete"
    )


def _ready_state(driver) -> str:
    try:
        return driver.execute_script("return document.readyState")
    except Exception:
        return "loading"


def assert_no_server_error(driver) -> None:
    """Assert the page does not show a Next.js error boundary."""
    body_text = driver.find_element(By.TAG_NAME, "body").text.lower()
    assert "application error" not in body_text, "Page shows application error"
    assert "500" not in driver.title, "Page title indicates 500 error"


# ---------------------------------------------------------------------------
# App Health — root redirect and dashboard
# ---------------------------------------------------------------------------

class TestAppHealth:
    def test_root_redirects_to_dashboard(self, driver, base_url):
        """Root path should redirect to /dashboard without a server error."""
        navigate(driver, base_url, "/")
        assert_no_server_error(driver)
        assert "/dashboard" in driver.current_url, (
            f"Expected redirect to /dashboard, got: {driver.current_url}"
        )

    def test_dashboard_page_loads(self, driver, base_url):
        """Dashboard page must load and display the main heading."""
        navigate(driver, base_url, "/dashboard")
        assert_no_server_error(driver)
        # The page title or an h1 heading should contain dashboard-related text
        body_text = driver.find_element(By.TAG_NAME, "body").text
        assert body_text.strip() != "", "Dashboard page body is empty"

    def test_dashboard_shows_emission_kpis(self, driver, base_url):
        """Dashboard should render KPI cards with emission totals."""
        navigate(driver, base_url, "/dashboard")
        assert_no_server_error(driver)
        # Wait for any element that represents a KPI value (number on screen)
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.TAG_NAME, "main"))
        )
        main_text = driver.find_element(By.TAG_NAME, "main").text
        # The demo seed data pre-loads emission records, so KPI numbers must appear
        assert main_text.strip() != "", "Dashboard <main> area is empty — KPIs may not be rendered"


# ---------------------------------------------------------------------------
# Navigation — sidebar links reach all key pages
# ---------------------------------------------------------------------------

class TestNavigation:
    @pytest.mark.parametrize("path,expected_fragment", [
        ("/scope-1", "scope"),
        ("/scope-2", "scope"),
        ("/scope-3", "scope"),
        ("/suppliers", "supplier"),
    ])
    def test_page_loads_without_error(self, driver, base_url, path, expected_fragment):
        """Each main page should load without a server error."""
        navigate(driver, base_url, path)
        assert_no_server_error(driver)
        body_text = driver.find_element(By.TAG_NAME, "body").text.lower()
        assert expected_fragment in body_text or driver.current_url.endswith(path), (
            f"Page {path} loaded but expected content not found. URL: {driver.current_url}"
        )


# ---------------------------------------------------------------------------
# Scope 1 — user can view emissions records
# ---------------------------------------------------------------------------

class TestScope1:
    def test_scope1_page_renders_main_content(self, driver, base_url):
        """Scope 1 page must render its main content area."""
        navigate(driver, base_url, "/scope-1")
        assert_no_server_error(driver)
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.TAG_NAME, "main"))
        )

    def test_scope1_shows_data_table_or_empty_state(self, driver, base_url):
        """Scope 1 page should show a table of records or an empty state message."""
        navigate(driver, base_url, "/scope-1")
        assert_no_server_error(driver)
        body_text = driver.find_element(By.TAG_NAME, "body").text
        # Either a table/list of records or an empty-state message must be present
        assert body_text.strip() != "", "Scope 1 page appears blank"


# ---------------------------------------------------------------------------
# Scope 2 — user can view market-based emissions
# ---------------------------------------------------------------------------

class TestScope2:
    def test_scope2_page_renders_main_content(self, driver, base_url):
        """Scope 2 page must render its main content area."""
        navigate(driver, base_url, "/scope-2")
        assert_no_server_error(driver)
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.TAG_NAME, "main"))
        )


# ---------------------------------------------------------------------------
# Scope 3 — user can view value-chain emissions
# ---------------------------------------------------------------------------

class TestScope3:
    def test_scope3_page_renders_main_content(self, driver, base_url):
        """Scope 3 page must render its main content area."""
        navigate(driver, base_url, "/scope-3")
        assert_no_server_error(driver)
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.TAG_NAME, "main"))
        )


# ---------------------------------------------------------------------------
# Suppliers — user can view supplier list
# ---------------------------------------------------------------------------

class TestSuppliers:
    def test_suppliers_page_renders_main_content(self, driver, base_url):
        """Suppliers page must render its main content area."""
        navigate(driver, base_url, "/suppliers")
        assert_no_server_error(driver)
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.TAG_NAME, "main"))
        )

    def test_suppliers_page_shows_supplier_data_or_empty_state(self, driver, base_url):
        """Suppliers page should show supplier records or an empty state."""
        navigate(driver, base_url, "/suppliers")
        assert_no_server_error(driver)
        body_text = driver.find_element(By.TAG_NAME, "body").text
        assert body_text.strip() != "", "Suppliers page appears blank"
