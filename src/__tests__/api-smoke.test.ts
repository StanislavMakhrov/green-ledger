import { describe, it, expect } from 'vitest';

// Smoke tests to verify API route files exist and export the expected handlers
// These don't make actual HTTP calls (no DB needed) but verify module structure

describe('API Route Exports', () => {
  it('calculations module exports calculateProxyEmissions', async () => {
    const mod = await import('@/lib/calculations');
    expect(typeof mod.calculateProxyEmissions).toBe('function');
  });

  it('constants module exports DEMO_COMPANY_ID', async () => {
    const mod = await import('@/lib/constants');
    expect(mod.DEMO_COMPANY_ID).toBe('00000000-0000-0000-0000-000000000001');
  });

  it('constants module exports PROXY_FACTOR', async () => {
    const mod = await import('@/lib/constants');
    expect(mod.PROXY_FACTOR).toBe(0.00042);
  });

  it('constants module exports PROXY_FACTOR_SOURCE', async () => {
    const mod = await import('@/lib/constants');
    expect(typeof mod.PROXY_FACTOR_SOURCE).toBe('string');
    expect(mod.PROXY_FACTOR_SOURCE.length).toBeGreaterThan(0);
  });
});
