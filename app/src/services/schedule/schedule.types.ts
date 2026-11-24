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

/** Where an activity stands while the event runs. */
export type ScheduleActivityStatus = 'planned' | 'running' | 'done' | 'skipped'

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
  /** Every team of the event, as a live wildcard. `teams` is then empty. */
  allTeams: boolean
  teams: ScheduleActivityTeam[]
  status: ScheduleActivityStatus
  /** ISO instants of what really happened, or null until it does. */
  actualStartedAt: string | null
  actualEndedAt: string | null
  /** A trim set during the event, or null. */
  adjustedDurationMinutes: number | null
  /** `adjustedDurationMinutes ?? durationMinutes`. */
  effectiveDurationMinutes: number
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
  /** The caller's team in the current event, or null (an admin on no team). */
  myTeamInstanceId: string | null
  /** The role the caller reads it in: their team role, or admin when on no team. */
  viewerRole: ScheduleViewerRole
  days: ScheduleDay[]
  /** The server's clock as an ISO instant. */
  serverNow: string
}

export type ScheduleViewerRole = 'admin' | 'coordinator' | 'member'

/** The `POST /schedule/days` body. */
export type CreateScheduleDayBody = {
  /** `YYYY-MM-DD`, within the event's dates. */
  date: string
}

export type CreateScheduleDayResult = {
  dayId: string
  date: string
}

export type UpdateScheduleDayBody = {
  /** `YYYY-MM-DD`, within the event's dates and free of other days. */
  date: string
}

export type UpdateScheduleDayResult = {
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
  /** Every team of the event. Never sent with `teamInstanceIds`. */
  allTeams: boolean
}

export type CreateScheduleActivityResult = {
  activityId: string
}

export type UpdateScheduleActivityResult = {
  activityId: string
}

/**
 * The body of every clock control (start, finish, skip, undo): the status the
 * screen shows.
 * The API answers 409 when it no longer matches.
 */
export type ScheduleActivityControlBody = {
  expectedStatus: ScheduleActivityStatus
}

export type StartScheduleActivityResult = {
  activityId: string
  /** The activity the start finished, or null when nothing was running. */
  finishedActivityId: string | null
}

export type FinishScheduleActivityResult = {
  activityId: string
}

export type SkipScheduleActivityResult = {
  activityId: string
}

export type UndoScheduleActivityResult = {
  activityId: string
  /** The status the activity went back to. */
  status: ScheduleActivityStatus
}

export const scheduleQueryKeys = {
  all: ['schedule'] as const,
}

export const scheduleMutationKeys = {
  /** Every clock control (start, finish, skip, undo), so "is one in flight?" can be asked. */
  control: ['schedule', 'control'] as const,
}
