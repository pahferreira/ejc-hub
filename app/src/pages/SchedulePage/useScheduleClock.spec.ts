import { describe, expect, it } from 'vitest'
import { clockOffsetMs, serverClockNow } from './useScheduleClock'

const HOUR_MS = 3_600_000
const SERVER_NOW = '2026-04-03T21:00:00.000Z'
const SERVER_MS = new Date(SERVER_NOW).getTime()

describe('clockOffsetMs', () => {
  it('is positive for a device clock an hour behind the server', () => {
    expect(clockOffsetMs(SERVER_NOW, SERVER_MS - HOUR_MS)).toBe(HOUR_MS)
  })

  it('is negative for a device clock an hour ahead of the server', () => {
    expect(clockOffsetMs(SERVER_NOW, SERVER_MS + HOUR_MS)).toBe(-HOUR_MS)
  })

  it('is zero before any response', () => {
    expect(clockOffsetMs(undefined, 0)).toBe(0)
  })

  it('is zero for an unreadable serverNow', () => {
    expect(clockOffsetMs('not a date', SERVER_MS)).toBe(0)
  })
})

describe('serverClockNow', () => {
  it.each([
    ['behind', -HOUR_MS],
    ['ahead', HOUR_MS],
  ])('reads the server time from a device clock an hour %s', (_label, skewMs) => {
    const receivedAtMs = SERVER_MS + skewMs
    const offsetMs = clockOffsetMs(SERVER_NOW, receivedAtMs)
    // Ninety seconds later on the device's clock.
    const now = serverClockNow(receivedAtMs + 90_000, offsetMs)

    expect(now).toEqual(new Date('2026-04-03T21:01:30.000Z'))
  })
})
