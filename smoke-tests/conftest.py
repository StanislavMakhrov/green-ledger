"""
Shared pytest fixtures for GreenLedger Selenium smoke tests.

The BASE_URL environment variable controls the target host
(default: http://localhost:3000 — the Docker container exposed port).

Chrome runs in headless mode so tests can execute in CI without a display.
"""

import os
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options


BASE_URL = os.environ.get("BASE_URL", "http://localhost:3000")


@pytest.fixture(scope="session")
def base_url() -> str:
    return BASE_URL


@pytest.fixture(scope="session")
def driver() -> webdriver.Chrome:
    """Create a shared headless Chrome WebDriver for the test session."""
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1280,900")
    chrome = webdriver.Chrome(options=options)
    chrome.implicitly_wait(10)
    yield chrome
    chrome.quit()
