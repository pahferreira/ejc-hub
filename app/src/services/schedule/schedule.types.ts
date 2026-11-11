/** Mirrors the API's `ScheduleEvent`: the current event's name and São Paulo dates. */
export type ScheduleEvent = {
  name: string
  /** `YYYY-MM-DD`, or null when the event has no start set. */
  startDate: string | null
  /** `YYYY-MM-DD`, or null when the event has no end set. */
  endDate: string | null
}

/** One team responsible for an activity, as a card draws it. */
export type ScheduleActivityTeam = {
  teamInstanceId: string
  teamName: string
  teamKey: string
  /** Picked from the team key; maps to the circle's color. */
  colorToken: string
}

/** One activity on a day, as the Cronograma shows it. */
export type ScheduleActivity = {
  id: string
  title: string
  /** An ISO instant; shown in São Paulo time. */
  plannedStartsAt: string
  durationMinutes: number
  place: string
  guestName: string | null
  adminsResponsible: boolean
  teams: ScheduleActivityTeam[]
}

/** One schedule day: a São Paulo date of the current event, with its activities. */
export type ScheduleDay = {
  id: string
  /** `YYYY-MM-DD`. */
  date: string
  activityCount: number
  /** The day's activities, earliest planned start first. */
  activities: ScheduleActivity[]
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

/** The activity body, sent whole both to add (`POST`) and to edit (`PATCH`) one. */
export type ScheduleActivityBody = {
  dayId: string
  title: string
  /** An ISO instant, built from the day's date and the `HH:mm` start. */
  plannedStartsAt: string
  durationMinutes: number
  place: string
  teamInstanceIds: string[]
  guestName: string | null
  adminsResponsible: boolean
}

export type CreateScheduleActivityResult = {
  activityId: string
}

export type UpdateScheduleActivityResult = {
  activityId: string
}

export const scheduleQueryKeys = {
  all: ['schedule'] as const,
}
