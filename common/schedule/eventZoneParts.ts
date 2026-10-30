import { EVENT_TIME_ZONE } from './schedule.constants'

// Never shown to the user: only its numeric parts are read, to build
// `HH:mm` and `YYYY-MM-DD`. A fixed locale keeps those parts predictable.
const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: EVENT_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

export type EventZoneParts = {
  year: string
  month: string
  day: string
  hour: string
  minute: string
}

/** The wall-clock fields of an instant, read in São Paulo time. */
export const eventZoneParts = (instant: Date): EventZoneParts => {
  const parts = Object.fromEntries(
    formatter.formatToParts(instant).map(({ type, value }) => [type, value])
  )
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
  }
}
