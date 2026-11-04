import { eventZoneParts } from './eventZoneParts.ts'

/** The `HH:mm` a São Paulo clock shows at an instant. */
export const toEventTime = (instant: Date): string => {
  const { hour, minute } = eventZoneParts(instant)
  return `${hour}:${minute}`
}
