import { useState } from 'react'
import { defaultDayId } from '../../utils/scheduleTimeline/scheduleTimeline'
import type { ScheduleDay } from '../../services/schedule/schedule.types'

/**
 * The day whose tab is shown: the one picked, or `defaultDayId`'s while none is
 * (or the picked one is gone). Undefined when no days are planned.
 */
export function selectedScheduleDay(
  days: ScheduleDay[],
  pickedDayId: string | null,
  now: Date
): ScheduleDay | undefined {
  return (
    days.find((day) => day.id === pickedDayId) ??
    days.find((day) => day.id === defaultDayId(days, now))
  )
}

/**
 * The Cronograma's selected day tab. Held by id and derived on every render, so
 * the page opens on the right day without an effect to set it once the data
 * arrives.
 */
export function useSelectedScheduleDay(days: ScheduleDay[]) {
  const [pickedDayId, setPickedDayId] = useState<string | null>(null)

  return {
    selectedDay: selectedScheduleDay(days, pickedDayId, new Date()),
    selectDay: setPickedDayId,
  }
}
