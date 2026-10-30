/** The current event as the planning page shows it: its name and São Paulo dates. */
export type ScheduleEvent = {
  name: string
  /** `YYYY-MM-DD` in São Paulo, or null when the event has no start set. */
  startDate: string | null
  /** `YYYY-MM-DD` in São Paulo, or null when the event has no end set. */
  endDate: string | null
}

/** One schedule day: a date of the current event. */
export type ScheduleDay = {
  id: string
  /** `YYYY-MM-DD`, a São Paulo date. */
  date: string
  activityCount: number
}

/** Everything `GET /schedule` answers: the current event's days, earliest first. */
export type ScheduleReadModel = {
  event: ScheduleEvent
  days: ScheduleDay[]
}

export type CreateScheduleDayInput = {
  /** `YYYY-MM-DD`, a São Paulo date within the event. */
  date: string
}

export type CreateScheduleDayResult = {
  dayId: string
  date: string
}

export type DeleteScheduleDayResult = {
  dayId: string
}
