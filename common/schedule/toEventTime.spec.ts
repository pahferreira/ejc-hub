import { describe, it, expect } from 'vitest'
import { toEventTime } from './toEventTime'

describe('toEventTime', () => {
  it('reads an instant as HH:mm on the São Paulo clock', () => {
    expect(toEventTime(new Date('2026-11-14T11:30:00.000Z'))).toBe('08:30')
  })

  it('shows midnight as 00:00, not 24:00', () => {
    expect(toEventTime(new Date('2026-11-15T03:00:00.000Z'))).toBe('00:00')
  })
})
