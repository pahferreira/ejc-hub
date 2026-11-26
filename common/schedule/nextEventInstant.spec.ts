import { describe, it, expect } from 'vitest'
import { nextEventInstant } from './nextEventInstant'

// São Paulo is UTC-3: 18:00 on 2026-04-03 is 21:00Z.
describe('nextEventInstant', () => {
  it('keeps a later time on the same date', () => {
    expect(nextEventInstant(new Date('2026-04-03T21:00:00Z'), '18:30')).toEqual(
      new Date('2026-04-03T21:30:00Z')
    )
  })

  it('rolls a time not later than the start to the next day: 23:55 to 00:05', () => {
    expect(nextEventInstant(new Date('2026-04-04T02:55:00Z'), '00:05')).toEqual(
      new Date('2026-04-04T03:05:00Z')
    )
  })

  it('rolls the very same time to the next day', () => {
    expect(nextEventInstant(new Date('2026-04-03T21:00:00Z'), '18:00')).toEqual(
      new Date('2026-04-04T21:00:00Z')
    )
  })
})
