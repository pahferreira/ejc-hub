import { describe, it, expect } from 'vitest'
import { toEventInstant } from './toEventInstant'
import { toEventDate } from './toEventDate'
import { toEventTime } from './toEventTime'

describe('toEventInstant', () => {
  it('turns a day and HH:mm into the São Paulo instant (UTC-3)', () => {
    expect(toEventInstant('2026-11-14', '08:30').toISOString()).toBe('2026-11-14T11:30:00.000Z')
  })

  it('throws on a time that is not HH:mm instead of returning an Invalid Date', () => {
    expect(() => toEventInstant('2026-11-14', 'noon')).toThrow(RangeError)
  })
})

describe('toEventInstant round-trip', () => {
  it.each([
    ['2026-11-14', '00:00'],
    ['2026-11-14', '23:59'],
    ['2026-11-14', '21:15'],
  ])('%s %s comes back as the same day and time', (date, time) => {
    const instant = toEventInstant(date, time)

    expect(toEventDate(instant)).toBe(date)
    expect(toEventTime(instant)).toBe(time)
  })

  it('places 23:30 on the next UTC day', () => {
    expect(toEventInstant('2026-11-14', '23:30').toISOString()).toBe('2026-11-15T02:30:00.000Z')
  })

  it('uses the offset in force on that day, not a fixed UTC-3', () => {
    // São Paulo observed daylight saving (UTC-2) until 2019.
    expect(toEventInstant('2018-12-01', '10:00').toISOString()).toBe('2018-12-01T12:00:00.000Z')
  })
})
