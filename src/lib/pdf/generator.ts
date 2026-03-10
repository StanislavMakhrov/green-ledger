/**
 * PDF generator using Puppeteer.
 * Renders HTML to a PDF buffer using the system Chromium installation.
 * Uses --no-sandbox flags required for running in Docker/CI environments.
 */

/**
 * Renders the provided HTML string to a PDF buffer.
 *
 * @param html - Complete HTML document string (self-contained, no external resources)
 * @returns Promise resolving to a Buffer containing the PDF bytes
 * @throws Error if Puppeteer or Chromium is not available
 */
export async function generatePDF(html: string): Promise<Buffer> {
  // Dynamic import so the module doesn't fail at load time if puppeteer is absent
  const puppeteer = await import("puppeteer");

  // Prefer the system Chromium to avoid downloading a bundled one in Docker
  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH ??
    (await findSystemChromium());

  if (!executablePath) {
    throw new Error(
      "Chromium executable not found. Install Chromium or set PUPPETEER_EXECUTABLE_PATH."
    );
  }

  const browser = await puppeteer.default.launch({
    executablePath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  try {
    const page = await browser.newPage();

    // Set content directly — no network required since HTML is self-contained
    await page.setContent(html, { waitUntil: "domcontentloaded" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", right: "15mm", bottom: "20mm", left: "15mm" },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

/** Finds the system Chromium executable path, or returns null if not found. */
async function findSystemChromium(): Promise<string | null> {
  const candidates = [
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
  ];

  const { access } = await import("fs/promises");
  for (const path of candidates) {
    try {
      await access(path);
      return path;
    } catch {
      // Not found at this path, try the next one
    }
  }
  return null;
}
