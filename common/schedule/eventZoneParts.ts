import { EVENT_TIME_ZONE } from './schedule.constants'

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
