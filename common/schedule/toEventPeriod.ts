import { eventZoneParts } from './eventZoneParts.ts'
import { toEventDate } from './toEventDate.ts'

/** The part of a schedule day an activity starts in: Manhã, Tarde or Noite. */
export type EventPeriod = 'morning' | 'afternoon' | 'night'

const AFTERNOON_STARTS_AT_HOUR = 12
const NIGHT_STARTS_AT_HOUR = 18

/**
 * The period of `dayDate` (`YYYY-MM-DD`) an activity starting at `instant` falls
 * in, on the São Paulo clock: morning before 12:00, afternoon until 18:00, night
 * from 18:00. A start on a later São Paulo date than the day's is past midnight,
 * and stays in its day's night rather than jumping back to morning.
 */
export const toEventPeriod = (instant: Date, dayDate: string): EventPeriod => {
  if (toEventDate(instant) > dayDate) {
    return 'night'
  }

  const hour = Number(eventZoneParts(instant).hour)

  if (hour < AFTERNOON_STARTS_AT_HOUR) {
    return 'morning'
  }

  return hour < NIGHT_STARTS_AT_HOUR ? 'afternoon' : 'night'
}
