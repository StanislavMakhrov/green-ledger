/**
 * Smoke Tests for GreenLedger
 *
 * These tests verify that the running application responds correctly to key
 * HTTP requests. They are designed to run against a live server (Docker or dev).
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 npm run test:smoke
 *
 * The BASE_URL defaults to http://localhost:3000 when not set.
 *
 * In CI, these tests run after the Docker image is pulled and started.
 * UAT Tester agent writes PR-specific tests alongside this template.
 */

import { describe, it, expect } from 'vitest'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

describe('GreenLedger Smoke Tests', () => {
  describe('Homepage', () => {
    it('GET / returns 200', async () => {
      const res = await fetch(`${BASE_URL}/`)
      expect(res.status).toBe(200)
    })

    it('GET / returns HTML content', async () => {
      const res = await fetch(`${BASE_URL}/`)
      const text = await res.text()
      expect(text).toContain('<!DOCTYPE html>')
    })
  })

  describe('Dashboard', () => {
    it('GET /dashboard returns 200 or redirects', async () => {
      const res = await fetch(`${BASE_URL}/dashboard`, { redirect: 'manual' })
      // Accept 200 (direct load) or 3xx (auth redirect)
      expect(res.status).toBeLessThan(400)
    })
  })

  describe('Core App Routes', () => {
    const routes = [
      '/scope-1',
      '/scope-2',
      '/scope-3',
      '/suppliers',
      '/methodology',
      '/export',
    ]

    for (const route of routes) {
      it(`GET ${route} is accessible`, async () => {
        const res = await fetch(`${BASE_URL}${route}`, { redirect: 'manual' })
        expect(res.status).toBeLessThan(400)
      })
    }
  })

  describe('API Health', () => {
    it('GET /api/company returns < 500', async () => {
      const res = await fetch(`${BASE_URL}/api/company`, { redirect: 'manual' })
      // 200 OK or 4xx (auth) are both acceptable; 5xx means the server is broken
      expect(res.status).toBeLessThan(500)
    })
  })
})
