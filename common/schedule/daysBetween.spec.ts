import { describe, it, expect } from 'vitest'
import { daysBetween } from './daysBetween'

describe('daysBetween', () => {
  it('counts the days to a later date, across a month end', () => {
    expect(daysBetween('2026-04-30', '2026-05-02')).toBe(2)
  })

  it('is negative to an earlier date and zero to the same one', () => {
    expect(daysBetween('2026-04-03', '2026-04-01')).toBe(-2)
    expect(daysBetween('2026-04-03', '2026-04-03')).toBe(0)
  })
})
