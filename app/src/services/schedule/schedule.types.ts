/** Mirrors the API's `ScheduleEvent`: the current event's name and São Paulo dates. */
export type ScheduleEvent = {
  name: string
  /** `YYYY-MM-DD`, or null when the event has no start set. */
  startDate: string | null
  /** `YYYY-MM-DD`, or null when the event has no end set. */
  endDate: string | null
}

/** One schedule day: a São Paulo date of the current event. */
export type ScheduleDay = {
  id: string
  /** `YYYY-MM-DD`. */
  date: string
  activityCount: number
}

/** Everything `GET /schedule` answers. Days come earliest first. */
export type ScheduleReadModel = {
  event: ScheduleEvent
  days: ScheduleDay[]
}

/** The `POST /schedule/days` body. */
export type CreateScheduleDayBody = {
  /** `YYYY-MM-DD`, within the event's dates. */
  date: string
}

export type CreateScheduleDayResult = {
  dayId: string
  date: string
}

export const scheduleQueryKeys = {
  all: ['schedule'] as const,
}
