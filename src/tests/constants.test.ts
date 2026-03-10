import { describe, it, expect } from 'vitest'
import {
  DEMO_COMPANY_ID,
  PROXY_FACTOR,
  PROXY_FACTOR_SOURCE,
  TRANSPORT_FACTOR,
  TRANSPORT_FACTOR_SOURCE,
  WASTE_FACTOR,
  WASTE_FACTOR_SOURCE,
} from '@/lib/constants'

describe('constants', () => {
  it('DEMO_COMPANY_ID is a valid UUID', () => {
    expect(DEMO_COMPANY_ID).toBe('00000000-0000-0000-0000-000000000001')
  })

  it('PROXY_FACTOR is a positive number', () => {
    expect(PROXY_FACTOR).toBeGreaterThan(0)
    expect(typeof PROXY_FACTOR).toBe('number')
  })

  it('PROXY_FACTOR_SOURCE is a non-empty string', () => {
    expect(PROXY_FACTOR_SOURCE.length).toBeGreaterThan(0)
  })

  it('TRANSPORT_FACTOR is a positive number', () => {
    expect(TRANSPORT_FACTOR).toBeGreaterThan(0)
    expect(typeof TRANSPORT_FACTOR).toBe('number')
  })

  it('TRANSPORT_FACTOR_SOURCE is a non-empty string', () => {
    expect(TRANSPORT_FACTOR_SOURCE.length).toBeGreaterThan(0)
  })

  it('WASTE_FACTOR is a positive number', () => {
    expect(WASTE_FACTOR).toBeGreaterThan(0)
    expect(typeof WASTE_FACTOR).toBe('number')
  })

  it('WASTE_FACTOR_SOURCE is a non-empty string', () => {
    expect(WASTE_FACTOR_SOURCE.length).toBeGreaterThan(0)
  })
})
