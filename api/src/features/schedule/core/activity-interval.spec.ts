import { describe, it, expect } from 'vitest'
import { activityEnd, intervalsOverlap, overlapsAny } from './activity-interval.ts'

describe('activityEnd', () => {
  it('adds the duration in minutes to the start instant', () => {
    expect(activityEnd(new Date('2026-04-03T21:00:00Z'), 30)).toEqual(
      new Date('2026-04-03T21:30:00Z')
    )
  })

  it('crosses midnight when the duration runs into the next day', () => {
    // 23:00 São Paulo (02:00Z) + 120 min → 01:00 São Paulo (04:00Z).
    expect(activityEnd(new Date('2026-04-04T02:00:00Z'), 120)).toEqual(
      new Date('2026-04-04T04:00:00Z')
    )
  })
})

describe('intervalsOverlap', () => {
  const a = (iso: string) => new Date(iso)

  it('is true when one interval starts inside the other', () => {
    expect(
      intervalsOverlap(
        a('2026-04-03T21:00:00Z'),
        a('2026-04-03T21:30:00Z'),
        a('2026-04-03T21:15:00Z'),
        a('2026-04-03T21:45:00Z')
      )
    ).toBe(true)
  })

  it('is false when the intervals only touch at the edge', () => {
    // [18:00, 18:30) and [18:30, 19:00) — back to back, no overlap.
    expect(
      intervalsOverlap(
        a('2026-04-03T21:00:00Z'),
        a('2026-04-03T21:30:00Z'),
        a('2026-04-03T21:30:00Z'),
        a('2026-04-03T22:00:00Z')
      )
    ).toBe(false)
  })

  it('is false when the intervals are fully apart', () => {
    expect(
      intervalsOverlap(
        a('2026-04-03T21:00:00Z'),
        a('2026-04-03T21:30:00Z'),
        a('2026-04-03T22:00:00Z'),
        a('2026-04-03T22:30:00Z')
      )
    ).toBe(false)
  })

  it('is symmetric in the order of the two intervals', () => {
    const first = [a('2026-04-03T21:00:00Z'), a('2026-04-03T22:00:00Z')] as const
    const second = [a('2026-04-03T21:30:00Z'), a('2026-04-03T21:45:00Z')] as const

    expect(intervalsOverlap(...first, ...second)).toBe(intervalsOverlap(...second, ...first))
  })

  it('is true when one interval fully contains the other', () => {
    expect(
      intervalsOverlap(
        a('2026-04-03T21:00:00Z'),
        a('2026-04-03T23:00:00Z'),
        a('2026-04-03T21:30:00Z'),
        a('2026-04-03T21:45:00Z')
      )
    ).toBe(true)
  })
})

describe('overlapsAny', () => {
  const planned = (iso: string, durationMinutes: number) => ({
    plannedStartsAt: new Date(iso),
    durationMinutes,
  })

  it('is true when the activity overlaps one of the others', () => {
    expect(
      overlapsAny(planned('2026-04-03T21:15:00Z', 30), [
        planned('2026-04-03T19:00:00Z', 30),
        planned('2026-04-03T21:00:00Z', 30),
      ])
    ).toBe(true)
  })

  it('is false when the activity only touches the others', () => {
    expect(
      overlapsAny(planned('2026-04-03T21:30:00Z', 30), [
        planned('2026-04-03T21:00:00Z', 30),
        planned('2026-04-03T22:00:00Z', 30),
      ])
    ).toBe(false)
  })

  it('is false against no others', () => {
    expect(overlapsAny(planned('2026-04-03T21:00:00Z', 30), [])).toBe(false)
  })
})
