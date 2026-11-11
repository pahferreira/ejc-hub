import { describe, it, expect } from 'vitest'
import { shiftByEventDays } from './shiftByEventDays'

describe('shiftByEventDays', () => {
  it('moves a past-midnight start to the same São Paulo time days later', () => {
    // 23:30 São Paulo on 2026-04-03 is already 2026-04-04 in UTC.
    expect(shiftByEventDays(new Date('2026-04-04T02:30:00.000Z'), 2)).toEqual(
      new Date('2026-04-06T02:30:00.000Z')
    )
  })

  it('moves a start back to an earlier day, and leaves it alone for zero days', () => {
    const start = new Date('2026-04-03T11:00:00.000Z')

    expect(shiftByEventDays(start, -1)).toEqual(new Date('2026-04-02T11:00:00.000Z'))
    expect(shiftByEventDays(start, 0)).toEqual(start)
  })
})
