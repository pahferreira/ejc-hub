import { eventZoneParts } from './eventZoneParts.ts'

/** The São Paulo date (`YYYY-MM-DD`) of an instant. */
export const toEventDate = (instant: Date): string => {
  const { year, month, day } = eventZoneParts(instant)
  return `${year}-${month}-${day}`
}
