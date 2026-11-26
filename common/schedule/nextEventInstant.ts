import { shiftByEventDays } from './shiftByEventDays.ts'
import { toEventDate } from './toEventDate.ts'
import { toEventInstant } from './toEventInstant.ts'

/**
 * The first instant after `after` showing `time` (`HH:mm`) on the São Paulo
 * clock: on its date, or the next day when that time is not later. An end of
 * 00:05 after a start at 23:55 rolls to the next day.
 */
export const nextEventInstant = (after: Date, time: string): Date => {
  const sameDay = toEventInstant(toEventDate(after), time)
  return sameDay > after ? sameDay : shiftByEventDays(sameDay, 1)
}
