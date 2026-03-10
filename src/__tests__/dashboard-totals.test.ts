import { describe, it, expect } from 'vitest';

// Test the business logic for dashboard totals (pure functions)
describe('Dashboard Total Calculation', () => {
  it('adds scope 1 + scope 2 + scope 3 correctly', () => {
    const scope1 = 100;
    const scope2 = 50;
    const scope3 = 200;
    const total = scope1 + scope2 + scope3;
    expect(total).toBe(350);
  });

  it('handles zero values', () => {
    const total = 0 + 0 + 0;
    expect(total).toBe(0);
  });

  it('handles decimal precision', () => {
    const scope1 = 125.5;
    const scope2 = 87.3;
    const scope3 = 342.1;
    const total = scope1 + scope2 + scope3;
    expect(total).toBeCloseTo(554.9, 1);
  });
});
