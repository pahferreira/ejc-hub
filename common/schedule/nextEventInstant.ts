import { shiftByEventDays } from './shiftByEventDays.ts'
import { toEventDate } from './toEventDate.ts'
import { toEventInstant } from './toEventInstant.ts'
import { toEventTime } from './toEventTime.ts'

/**
 * The first instant after `after` showing `time` (`HH:mm`) on the São Paulo
 * clock: on its date, or the next day when that time is earlier. An end of
 * 00:05 after a start at 23:55 rolls to the next day.
 *
 * The very same `HH:mm` as `after` never rolls: a day-long activity is a
 * mistake, so it stays on that date, at or before `after`, for the caller to
 * refuse as an end not after its start.
 */
export const nextEventInstant = (after: Date, time: string): Date => {
  const sameDay = toEventInstant(toEventDate(after), time)

  if (sameDay > after || toEventTime(after) === time) {
    return sameDay
  }

  return shiftByEventDays(sameDay, 1)
}
