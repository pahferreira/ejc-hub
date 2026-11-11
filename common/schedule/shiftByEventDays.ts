import { toEventDate } from './toEventDate.ts'
import { toEventInstant } from './toEventInstant.ts'
import { toEventTime } from './toEventTime.ts'

const DAY_MS = 86_400_000

/** `YYYY-MM-DD` plus a whole number of days. */
const addDays = (date: string, days: number): string =>
  new Date(Date.parse(date) + days * DAY_MS).toISOString().slice(0, 10)

/**
 * The instant `days` São Paulo days later than `instant`, at the same São Paulo
 * time of day. Reading the clock rather than adding 24 h steps keeps the time
 * even across an offset change.
 */
export const shiftByEventDays = (instant: Date, days: number): Date =>
  toEventInstant(addDays(toEventDate(instant), days), toEventTime(instant))
