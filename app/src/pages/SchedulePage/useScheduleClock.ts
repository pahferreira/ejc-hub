import { useEffect, useState } from 'react'
import { useScheduleQuery } from '../../services/schedule/useScheduleQuery'

const TICK_MS = 1_000

/**
 * How far the device's clock is behind the server's: `serverNow` minus the
 * device time the response arrived at. Zero without a usable `serverNow`.
 */
export function clockOffsetMs(serverNow: string | undefined, receivedAtMs: number): number {
  const serverMs = serverNow ? new Date(serverNow).getTime() : NaN
  return Number.isNaN(serverMs) || receivedAtMs <= 0 ? 0 : serverMs - receivedAtMs
}

/** The server's clock now, from the device's and the last offset. */
export function serverClockNow(deviceNowMs: number, offsetMs: number): Date {
  return new Date(deviceNowMs + offsetMs)
}

/** The device's clock, re-read every second while the tab is visible. */
function useTick(enabled: boolean): number {
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    if (!enabled) return

    let interval: ReturnType<typeof setInterval> | undefined
    const run = () => {
      clearInterval(interval)
      interval = undefined
      if (document.hidden) return
      setNowMs(Date.now())
      interval = setInterval(() => setNowMs(Date.now()), TICK_MS)
    }

    run()
    document.addEventListener('visibilitychange', run)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', run)
    }
  }, [enabled])

  return nowMs
}

/**
 * The Cronograma's live clock. While `live`, it ticks every second (paused
 * while the tab is hidden), refetches `GET /schedule` every minute and on
 * return to the tab, and reads the time as the server's: the device's clock
 * plus the offset from the last response, so a wrong device clock or time
 * zone does not matter.
 */
export function useScheduleClock(live: boolean) {
  const query = useScheduleQuery({ live })
  const deviceNowMs = useTick(live)
  const offsetMs = clockOffsetMs(query.data?.serverNow, query.dataUpdatedAt)

  return { query, now: serverClockNow(deviceNowMs, offsetMs) }
}
