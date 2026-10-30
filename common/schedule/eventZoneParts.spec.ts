import { describe, it, expect } from 'vitest'
import { eventZoneParts } from './eventZoneParts'

describe('eventZoneParts', () => {
  it('reads the zero-padded wall-clock fields in São Paulo time', () => {
    expect(eventZoneParts(new Date('2026-03-05T10:07:00.000Z'))).toEqual({
      year: '2026',
      month: '03',
      day: '05',
      hour: '07',
      minute: '07',
    })
  })

  it('does not report the UTC fields when São Paulo is still on the previous day', () => {
    const parts = eventZoneParts(new Date('2026-01-01T01:00:00.000Z'))

    expect(parts).toMatchObject({ year: '2025', month: '12', day: '31', hour: '22' })
  })
})
