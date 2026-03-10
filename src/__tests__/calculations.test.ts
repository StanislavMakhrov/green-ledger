import { describe, it, expect } from 'vitest';
import { calculateProxyEmissions } from '@/lib/calculations';

describe('calculateProxyEmissions', () => {
  it('calculates spend-based emissions correctly', () => {
    const result = calculateProxyEmissions({ spend_eur: 1000 });
    expect(result.valueTco2e).toBeCloseTo(0.00042, 5); // 1000 * 0.00042 / 1000
    expect(result.calculationMethod).toBe('spend_based');
    expect(result.confidence).toBe(0.5);
  });

  it('calculates transport emissions correctly', () => {
    const result = calculateProxyEmissions({ ton_km: 1000 });
    expect(result.valueTco2e).toBeCloseTo(0.0001, 5); // 1000 * 0.0001 / 1000
    expect(result.calculationMethod).toBe('activity_based');
    expect(result.confidence).toBe(0.6);
  });

  it('calculates waste emissions correctly', () => {
    const result = calculateProxyEmissions({ waste_kg: 1000 });
    expect(result.valueTco2e).toBeCloseTo(0.0005, 5); // 1000 * 0.0005 / 1000
    expect(result.calculationMethod).toBe('activity_based');
    expect(result.confidence).toBe(0.4);
  });

  it('throws error when no valid input provided', () => {
    expect(() => calculateProxyEmissions({})).toThrow('No valid activity data provided');
  });

  it('throws error when all values are zero or negative', () => {
    expect(() => calculateProxyEmissions({ spend_eur: 0 })).toThrow();
  });

  it('includes emission factor source in result', () => {
    const result = calculateProxyEmissions({ spend_eur: 500 });
    expect(result.emissionFactorSource).toBeTruthy();
    expect(result.emissionFactorSource).toContain('DEFRA');
  });

  it('includes assumptions string describing the calculation', () => {
    const result = calculateProxyEmissions({ spend_eur: 500 });
    expect(result.assumptions).toContain('500');
    expect(result.assumptions).toContain('tCO₂e');
  });
});
