import type { ScheduleActivity } from '../../services/schedule/schedule.types'

/** The clock controls one activity shows. */
export type ActivityControls = {
  /** "Iniciar": only on the day's next planned activity. */
  start: boolean
  /** "Concluir": only on the running activity. */
  finish: boolean
}

/**
 * Which clock controls an activity shows, from its status and whether it is
 * the day's next planned one. Only someone who can control the clock gets any.
 * Activities start in strict order, so Iniciar never shows on a later planned
 * activity, even though the design draws it on every row.
 */
export function activityControls(
  activity: Pick<ScheduleActivity, 'id' | 'status'>,
  nextPlannedId: string | null,
  canControl: boolean
): ActivityControls {
  return {
    start: canControl && activity.status === 'planned' && activity.id === nextPlannedId,
    finish: canControl && activity.status === 'running',
  }
}

/** The activity in progress, or null. */
export function runningActivity<T extends Pick<ScheduleActivity, 'status'>>(
  activities: T[]
): T | null {
  return activities.find((activity) => activity.status === 'running') ?? null
}

/**
 * The first planned activity still to start, or null. Expects the day's
 * activities earliest first, as the API sends them.
 */
export function nextPlannedActivity<T extends Pick<ScheduleActivity, 'status'>>(
  activities: T[]
): T | null {
  return activities.find((activity) => activity.status === 'planned') ?? null
}

/** The "n" of a day's "Concluído n/m": its done activities. Skipped ones don't count. */
export function doneActivityCount(activities: Array<Pick<ScheduleActivity, 'status'>>): number {
  return activities.filter((activity) => activity.status === 'done').length
}
