import { shiftByEventDays } from './shiftByEventDays.ts'
import { toEventDate } from './toEventDate.ts'
import { toEventInstant } from './toEventInstant.ts'

/**
 * The instant showing `time` (`HH:mm`) on the São Paulo clock that lies
 * nearest `reference`: on its date, the day before or the day after. Correcting
 * 23:50 to 00:05 lands on the next day, 00:02 to 23:58 on the day before.
 */
export const nearestEventInstant = (reference: Date, time: string): Date => {
  const sameDay = toEventInstant(toEventDate(reference), time)
  const candidates = [shiftByEventDays(sameDay, -1), sameDay, shiftByEventDays(sameDay, 1)]
  const distance = (candidate: Date) => Math.abs(candidate.getTime() - reference.getTime())

  return candidates.reduce((nearest, candidate) =>
    distance(candidate) < distance(nearest) ? candidate : nearest
  )
}
