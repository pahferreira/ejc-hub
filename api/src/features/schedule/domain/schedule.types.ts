/** The current event as the planning page shows it: its name and São Paulo dates. */
export type ScheduleEvent = {
  name: string
  /** `YYYY-MM-DD` in São Paulo, or null when the event has no start set. */
  startDate: string | null
  /** `YYYY-MM-DD` in São Paulo, or null when the event has no end set. */
  endDate: string | null
}

/** One team responsible for an activity, as a card draws it. */
export type ScheduleActivityTeam = {
  teamInstanceId: string
  teamName: string
  teamKey: string
  /** Picked from the team key; the app maps it to the circle's color. */
  colorToken: string
}

/** One activity on a day, as the Cronograma shows it. */
export type ScheduleActivity = {
  id: string
  title: string
  /** An ISO instant, entered and shown in São Paulo time. */
  plannedStartsAt: string
  durationMinutes: number
  place: string
  guestName: string | null
  adminsResponsible: boolean
  /** The teams responsible, in the order the API returns them. */
  teams: ScheduleActivityTeam[]
}

/** One schedule day: a date of the current event, with its activities. */
export type ScheduleDay = {
  id: string
  /** `YYYY-MM-DD`, a São Paulo date. */
  date: string
  activityCount: number
  /** The day's activities, earliest planned start first. */
  activities: ScheduleActivity[]
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

/** Adding an activity to a day of the current event. */
export type CreateScheduleActivityInput = {
  dayId: string
  title: string
  /** An ISO instant. The core rejects a start before the day's São Paulo 00:00. */
  plannedStartsAt: string
  /** Minutes; must be greater than zero. */
  durationMinutes: number
  place: string
  teamInstanceIds: string[]
  guestName: string | null
  adminsResponsible: boolean
}

export type CreateScheduleActivityResult = {
  activityId: string
}
