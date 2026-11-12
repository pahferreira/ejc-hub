import { describe, it, expect } from 'vitest'
import { toEventPeriod } from './toEventPeriod'

// São Paulo is UTC-3: 06:00 there is 09:00Z.
const FRIDAY = '2026-04-03'

describe('toEventPeriod', () => {
  it.each([
    ['06:00', '2026-04-03T09:00:00Z', 'morning'],
    ['11:59', '2026-04-03T14:59:00Z', 'morning'],
    ['12:00', '2026-04-03T15:00:00Z', 'afternoon'],
    ['17:59', '2026-04-03T20:59:00Z', 'afternoon'],
    ['18:00', '2026-04-03T21:00:00Z', 'night'],
    ['23:00', '2026-04-04T02:00:00Z', 'night'],
  ] as const)('puts a %s São Paulo start in the %s', (_time, instant, period) => {
    expect(toEventPeriod(new Date(instant), FRIDAY)).toBe(period)
  })

  it("keeps a start past midnight in its day's night, not the next morning", () => {
    expect(toEventPeriod(new Date('2026-04-04T03:30:00Z'), FRIDAY)).toBe('night')
  })

  it('reads the hour on the São Paulo clock, not UTC', () => {
    // 10:00 São Paulo is 13:00Z, which a UTC read would call afternoon.
    expect(toEventPeriod(new Date('2026-04-03T13:00:00Z'), FRIDAY)).toBe('morning')
  })
})
