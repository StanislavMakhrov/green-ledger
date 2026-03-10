/**
 * Baseline smoke tests for GreenLedger.
 *
 * These tests run from OUTSIDE the Docker container, calling the app over HTTP.
 * They verify that key pages load and that core API endpoints return expected shapes.
 *
 * The BASE_URL environment variable controls which host is tested
 * (default: http://localhost:3000 — the Docker container exposed port).
 *
 * Run via: npm run smoke-test (from src/)
 * Run in CI: smoke-tests job in pr-validation.yml
 */

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'

function get(path: string): Promise<Response> {
  return fetch(`${BASE_URL}${path}`)
}

/** Assert that a JSON response wraps its payload in a `data` array. */
async function assertDataArray(res: Response): Promise<void> {
  expect(res.status).toBe(200)
  const body = (await res.json()) as { data?: unknown }
  expect(body).toHaveProperty('data')
  expect(Array.isArray(body.data)).toBe(true)
}

// ---------------------------------------------------------------------------
// App health
// ---------------------------------------------------------------------------

describe('App Health', () => {
  it('root path responds without server error', async () => {
    // The root page redirects to /dashboard — follow redirects (default)
    const res = await get('/')
    expect(res.status).toBeLessThan(400)
  })

  it('GET /dashboard responds with 200', async () => {
    const res = await get('/dashboard')
    expect(res.status).toBe(200)
  })
})

// ---------------------------------------------------------------------------
// Key pages
// ---------------------------------------------------------------------------

describe('Key Pages', () => {
  const pages = [
    '/scope-1',
    '/scope-2',
    '/scope-3',
    '/suppliers',
  ]

  for (const page of pages) {
    it(`GET ${page} responds with 200`, async () => {
      const res = await get(page)
      expect(res.status).toBe(200)
    })
  }
})

// ---------------------------------------------------------------------------
// API: Dashboard — emission totals
// ---------------------------------------------------------------------------

describe('API: Dashboard', () => {
  it('GET /api/dashboard returns emission totals for the demo company', async () => {
    const res = await get('/api/dashboard')
    expect(res.status).toBe(200)

    const body = (await res.json()) as { data?: Record<string, unknown> }
    expect(body).toHaveProperty('data')
    const { data } = body
    expect(data).toHaveProperty('scope1Total')
    expect(data).toHaveProperty('scope2Total')
    expect(data).toHaveProperty('scope3Total')
    expect(data).toHaveProperty('total')
    expect(data).toHaveProperty('reportingYear')
    expect(data).toHaveProperty('companyName')
  })
})

// ---------------------------------------------------------------------------
// API: Suppliers
// ---------------------------------------------------------------------------

describe('API: Suppliers', () => {
  it('GET /api/suppliers returns a data array', async () => {
    await assertDataArray(await get('/api/suppliers'))
  })
})

// ---------------------------------------------------------------------------
// API: Scope Records
// ---------------------------------------------------------------------------

describe('API: Scope 1 Records', () => {
  it('GET /api/scope1 returns a data array', async () => {
    await assertDataArray(await get('/api/scope1'))
  })
})

describe('API: Scope 2 Records', () => {
  it('GET /api/scope2 returns a data array', async () => {
    await assertDataArray(await get('/api/scope2'))
  })
})

describe('API: Scope 3 Records', () => {
  it('GET /api/scope3/records returns a data array', async () => {
    await assertDataArray(await get('/api/scope3/records'))
  })
})
