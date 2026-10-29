import { eventZoneParts } from './eventZoneParts.ts'

const MINUTE_MS = 60_000

/** São Paulo's offset from UTC at an instant, in minutes (e.g. -180). */
const offsetMinutesAt = (instant: Date): number => {
  const { year, month, day, hour, minute } = eventZoneParts(instant)
  const wallClockAsUtc = Date.UTC(+year, +month - 1, +day, +hour, +minute)
  return (wallClockAsUtc - instant.getTime()) / MINUTE_MS
}

/**
 * The instant a São Paulo day (`YYYY-MM-DD`) shows `HH:mm` on the clock.
 *
 * Reads the offset from the time zone database rather than assuming UTC-3,
 * then re-reads it at the result in case that guess crossed an offset change.
 */
export const toEventInstant = (date: string, time: string): Date => {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  const wallClockAsUtc = Date.UTC(year, month - 1, day, hour, minute)

  const guess = new Date(wallClockAsUtc - offsetMinutesAt(new Date(wallClockAsUtc)) * MINUTE_MS)
  return new Date(wallClockAsUtc - offsetMinutesAt(guess) * MINUTE_MS)
}
