import { describe, it, expect } from 'vitest';

describe('Supplier Token Generation', () => {
  it('crypto.randomUUID generates valid UUID format', () => {
    const token = crypto.randomUUID();
    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    expect(token).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('each token is unique', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => crypto.randomUUID()));
    expect(tokens.size).toBe(100);
  });

  it('token can be used to construct a valid URL path', () => {
    const token = crypto.randomUUID();
    const url = `/public/supplier/${token}`;
    expect(url).toContain('/public/supplier/');
    expect(url).toContain(token);
  });
});
