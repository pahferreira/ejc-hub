import { describe, expect, it } from 'vitest'
import {
  actualDurationMinutes,
  driftTone,
  formatDayDrift,
  formatDriftMinutes,
  formatOverrunMinutes,
  formatStartsAt,
  formatStartsIn,
  formatTimer,
  roundToMinute,
  runningClock,
  startDriftMinutes,
} from './scheduleClock'

const MINUTE_MS = 60_000
// Started 18:07 São Paulo, 45 minutes long.
const RUNNING = { actualStartedAt: '2026-04-03T21:07:00Z', effectiveDurationMinutes: 45 }
const at = (iso: string) => new Date(iso)

describe('runningClock', () => {
  it('counts down while within the effective duration', () => {
    expect(runningClock(RUNNING, at('2026-04-03T21:17:30Z'))).toEqual({
      elapsedMs: 10.5 * MINUTE_MS,
      remainingMs: 34.5 * MINUTE_MS,
      overrunMs: 0,
      progress: 10.5 / 45,
    })
  })

  it('grows the overrun past the effective duration', () => {
    expect(runningClock(RUNNING, at('2026-04-03T21:55:00Z'))).toEqual({
      elapsedMs: 48 * MINUTE_MS,
      remainingMs: 0,
      overrunMs: 3 * MINUTE_MS,
      progress: 1,
    })
  })

  it('uses the trimmed (effective) duration', () => {
    const trimmed = { ...RUNNING, effectiveDurationMinutes: 20 }
    expect(runningClock(trimmed, at('2026-04-03T21:30:00Z')).overrunMs).toBe(3 * MINUTE_MS)
  })

  it('reads 0 before the actual start rather than negative time', () => {
    expect(runningClock(RUNNING, at('2026-04-03T21:00:00Z'))).toEqual({
      elapsedMs: 0,
      remainingMs: 45 * MINUTE_MS,
      overrunMs: 0,
      progress: 0,
    })
  })

  it('reads 0 elapsed without an actual start', () => {
    const notStarted = { ...RUNNING, actualStartedAt: null }
    expect(runningClock(notStarted, at('2026-04-03T21:30:00Z')).elapsedMs).toBe(0)
  })
})

describe('formatTimer', () => {
  it('shows minutes and seconds under an hour', () => {
    expect(formatTimer(5 * MINUTE_MS + 7_900)).toBe('05:07')
  })

  it('adds hours from an hour up', () => {
    expect(formatTimer(62 * MINUTE_MS + 3_000)).toBe('1:02:03')
  })

  it('reads a negative span as its size', () => {
    expect(formatTimer(-90_000)).toBe('01:30')
  })

  it('reads zero as 00:00', () => {
    expect(formatTimer(0)).toBe('00:00')
  })
})

describe('formatOverrunMinutes', () => {
  it('reads +1 min from the first second over', () => {
    expect(formatOverrunMinutes(10_000)).toBe('+1 min')
  })

  it('counts whole minutes, as Excedeu em does', () => {
    expect(formatOverrunMinutes(3 * MINUTE_MS + 10_000)).toBe('+3 min')
  })

  it('switches to hours from an hour up', () => {
    expect(formatOverrunMinutes(65 * MINUTE_MS)).toBe('+1h05')
  })
})

describe('formatDriftMinutes', () => {
  it('signs a late drift', () => {
    expect(formatDriftMinutes(7)).toBe('+7 min')
  })

  it('signs an early drift', () => {
    expect(formatDriftMinutes(-10)).toBe('-10 min')
  })

  it('uses hours for a long drift', () => {
    expect(formatDriftMinutes(19 * 60 + 14)).toBe('+19h14')
  })

  it('rounds to whole minutes', () => {
    expect(formatDriftMinutes(6.6)).toBe('+7 min')
  })
})

describe('driftTone', () => {
  it('is late for a positive drift', () => {
    expect(driftTone(3)).toBe('late')
  })

  it('is early for a negative drift', () => {
    expect(driftTone(-3)).toBe('early')
  })

  it('is on time under half a minute either way', () => {
    expect(driftTone(0.4)).toBe('onTime')
    expect(driftTone(-0.4)).toBe('onTime')
  })
})

describe('formatDayDrift', () => {
  it('reads a late day as Atraso', () => {
    expect(formatDayDrift(12.2)).toBe('Atraso +12 min')
  })

  it('reads an early day as Adiantado', () => {
    expect(formatDayDrift(-75)).toBe('Adiantado 1h15')
  })

  it('reads a day on time as No horário', () => {
    expect(formatDayDrift(0.2)).toBe('No horário')
  })
})

describe('formatStartsIn', () => {
  const now = at('2026-04-03T21:00:00Z')

  it('rounds the minutes left up', () => {
    expect(formatStartsIn(at('2026-04-03T21:11:10Z'), now)).toBe('em 12 min')
  })

  it('uses hours from an hour away', () => {
    expect(formatStartsIn(at('2026-04-03T22:05:00Z'), now)).toBe('em 1h05')
  })

  it('reads agora once the start is due', () => {
    expect(formatStartsIn(at('2026-04-03T20:55:00Z'), now)).toBe('agora')
  })
})

describe('formatStartsAt', () => {
  const now = at('2026-04-03T21:00:00Z')

  it('reads the Previsão on the São Paulo clock and how far off it is', () => {
    expect(formatStartsAt(at('2026-04-03T21:19:40Z'), now)).toBe('Começa às 18:20 — em 20 min')
  })

  it('reads agora once the Previsão is due', () => {
    expect(formatStartsAt(at('2026-04-03T20:59:00Z'), now)).toBe('Começa às 17:59 — agora')
  })
})

describe('startDriftMinutes', () => {
  const activity = { plannedStartsAt: '2026-04-03T21:00:00Z' }

  it('is positive when the Previsão is later than planned', () => {
    expect(startDriftMinutes(activity, at('2026-04-03T21:19:40Z'))).toBe(20)
  })

  it('is negative when the Previsão is earlier than planned', () => {
    expect(startDriftMinutes(activity, at('2026-04-03T20:50:00Z'))).toBe(-10)
  })
})

describe('roundToMinute', () => {
  it('rounds up from half a minute', () => {
    expect(roundToMinute(at('2026-04-03T21:19:40Z'))).toEqual(at('2026-04-03T21:20:00Z'))
  })

  it('rounds down under half a minute', () => {
    expect(roundToMinute(at('2026-04-03T21:19:20Z'))).toEqual(at('2026-04-03T21:19:00Z'))
  })
})

describe('actualDurationMinutes', () => {
  it('is the span between the actual times', () => {
    const done = {
      actualStartedAt: '2026-04-03T21:07:00Z',
      actualEndedAt: '2026-04-03T21:58:20Z',
      effectiveDurationMinutes: 45,
    }
    expect(actualDurationMinutes(done)).toBe(51)
  })

  it('falls back to the effective duration without both actual times', () => {
    const missingEnd = {
      actualStartedAt: '2026-04-03T21:07:00Z',
      actualEndedAt: null,
      effectiveDurationMinutes: 30,
    }
    expect(actualDurationMinutes(missingEnd)).toBe(30)
  })
})
