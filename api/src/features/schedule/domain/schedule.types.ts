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

/** Where an activity stands while the event runs. */
export type ScheduleActivityStatus = 'planned' | 'running' | 'done' | 'skipped'

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
  /** Every team of the event, as a live wildcard. `teams` is then empty. */
  allTeams: boolean
  /** The teams responsible, in the order the API returns them. */
  teams: ScheduleActivityTeam[]
  status: ScheduleActivityStatus
  /** ISO instants of what really happened, or null until it does. */
  actualStartedAt: string | null
  actualEndedAt: string | null
  /** A trim set during the event, or null. */
  adjustedDurationMinutes: number | null
  /** `adjustedDurationMinutes ?? durationMinutes`: the length the forecast uses. */
  effectiveDurationMinutes: number
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
  /** The viewer's team in the current event, or null (an admin on no team). */
  myTeamInstanceId: string | null
  /** The role the viewer reads it in: their team role, or admin when on no team. */
  viewerRole: ScheduleViewerRole
  days: ScheduleDay[]
  /** The server's clock as an ISO instant, so devices can correct their own. */
  serverNow: string
}

export type ScheduleViewerRole = 'admin' | 'coordinator' | 'member'

/** Who is reading the schedule: their Auth0 subject and the token's permissions. */
export type ScheduleViewer = {
  authId: string
  permissions: string[]
}

export type CreateScheduleDayInput = {
  /** `YYYY-MM-DD`, a São Paulo date within the event. */
  date: string
}

export type CreateScheduleDayResult = {
  dayId: string
  date: string
}

/** Moving a day of the current event to another date. */
export type UpdateScheduleDayInput = {
  /** `YYYY-MM-DD`, a São Paulo date within the event that no other day has. */
  date: string
}

export type UpdateScheduleDayResult = {
  dayId: string
  date: string
}

export type DeleteScheduleDayResult = {
  dayId: string
}

/** An activity's plan: everything an admin enters for it, on a day of the current event. */
export type ScheduleActivityPlan = {
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
  /** Every team of the event, as a live wildcard. Never sent with `teamInstanceIds`. */
  allTeams: boolean
}

/** Adding an activity to a day of the current event. */
export type CreateScheduleActivityInput = ScheduleActivityPlan

export type CreateScheduleActivityResult = {
  activityId: string
}

/** Editing an activity: every field is sent again, teams included. */
export type UpdateScheduleActivityInput = ScheduleActivityPlan

export type UpdateScheduleActivityResult = {
  activityId: string
}

export type DeleteScheduleActivityResult = {
  activityId: string
}

/**
 * A control request on an activity's clock: the status the admin saw, and who
 * they are. A stored status other than `expectedStatus` is a conflict.
 */
type ScheduleActivityControlInput = {
  expectedStatus: ScheduleActivityStatus
  /** The acting admin's Auth0 subject. */
  controllerAuthId: string
}

/** Starting the day's next planned activity. */
export type StartScheduleActivityInput = ScheduleActivityControlInput

export type StartScheduleActivityResult = {
  activityId: string
  /** The activity that was running and the start finished, or null. */
  finishedActivityId: string | null
}

/** Finishing the running activity. */
export type FinishScheduleActivityInput = ScheduleActivityControlInput

export type FinishScheduleActivityResult = {
  activityId: string
}

/** Skipping a planned activity: it takes no time in the forecast. */
export type SkipScheduleActivityInput = ScheduleActivityControlInput

export type SkipScheduleActivityResult = {
  activityId: string
}

/**
 * Undoing the last step of an activity's clock. `expectedStatus` names the
 * step: running is undone to planned (or back to done after a reopen), done
 * to running, skipped to planned.
 */
export type UndoScheduleActivityInput = ScheduleActivityControlInput

export type UndoScheduleActivityResult = {
  activityId: string
  /** The status the activity went back to. */
  status: ScheduleActivityStatus
}
