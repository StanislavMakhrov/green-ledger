import { defineConfig } from 'vitest/config'
import path from 'path'

/**
 * Vitest configuration for HTTP smoke tests.
 *
 * Smoke tests live under src/smoke-tests/ and are run against a live
 * Docker container (or any host set via the BASE_URL env var).
 * They are intentionally excluded from the standard `npm test` run
 * (see vitest.config.ts) and must be run separately via `npm run smoke-test`.
 */
export default defineConfig({
  test: {
    include: ['smoke-tests/**/*.smoke.test.ts'],
    environment: 'node',
    globals: true,
    // Allow up to 30 s per test — HTTP calls to a freshly-started container
    // can be slow on the first request while Next.js renders the page.
    testTimeout: 30000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
