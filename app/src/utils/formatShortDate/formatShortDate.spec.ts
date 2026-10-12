import { describe, it, expect } from 'vitest'
import { formatShortDate } from './formatShortDate'

describe('formatShortDate', () => {
  it('formats a date string as dd/MM', () => {
    expect(formatShortDate('2024-06-15T14:30:00Z')).toBe('15/06')
  })

  it('pads single-digit days and months', () => {
    expect(formatShortDate('2023-01-01T00:00:00.000Z')).toBe('01/01')
  })

  it('pins the UTC day rather than drifting with the local time zone', () => {
    // 23:30 UTC on the 25th stays the 25th here, even in a time zone ahead of
    // UTC where the local wall clock would already read the 26th.
    expect(formatShortDate('2024-12-25T23:30:00Z')).toBe('25/12')
  })
})
