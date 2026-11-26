import { describe, it, expect } from 'vitest'
import { nearestEventInstant } from './nearestEventInstant'

// São Paulo is UTC-3: 18:02 on 2026-04-03 is 21:02Z.
describe('nearestEventInstant', () => {
  it('keeps a time on the reference date when that is nearest', () => {
    expect(nearestEventInstant(new Date('2026-04-03T21:02:30Z'), '18:00')).toEqual(
      new Date('2026-04-03T21:00:00Z')
    )
  })

  it('rolls a time past midnight to the next day', () => {
    // 23:50 on the 3rd, corrected to 00:05: the 4th.
    expect(nearestEventInstant(new Date('2026-04-04T02:50:00Z'), '00:05')).toEqual(
      new Date('2026-04-04T03:05:00Z')
    )
  })

  it('moves a time back before midnight to the previous day', () => {
    // 00:02 on the 4th, corrected to 23:58: the 3rd.
    expect(nearestEventInstant(new Date('2026-04-04T03:02:00Z'), '23:58')).toEqual(
      new Date('2026-04-04T02:58:00Z')
    )
  })
})
