import type { ScheduleActivity } from '../../services/schedule/schedule.types'

/** The clock controls one activity shows. Controls that don't apply are hidden. */
export type ActivityControls = {
  /** "Iniciar": only on the day's next planned activity. */
  start: boolean
  /** "Concluir": only on the running activity. */
  finish: boolean
  /** "Pular": on every planned activity. */
  skip: boolean
  /** "Desfazer início": on the running activity. */
  undoStart: boolean
  /** "Reabrir": on the most recently finished activity, while nothing runs. */
  reopen: boolean
  /** "Desfazer" a skip: while no later activity of its day has started. */
  undoSkip: boolean
}

/** What, beyond its own status, decides an activity's controls. */
export type ActivityControlContext = {
  /** The day's next planned activity, from `nextPlannedActivity`. */
  nextPlannedId: string | null
  /** The activity that may reopen, from `reopenableActivity`. */
  reopenableId: string | null
  /** The activity's day, earliest first, as the API sends it. */
  dayActivities: Array<Pick<ScheduleActivity, 'id' | 'status'>>
}

/**
 * Whether a skipped activity's skip can be undone: no later activity of its
 * day has started (all are planned or skipped), so it can't become "next"
 * behind one that already ran. Expects the day earliest first.
 */
export function canUndoSkip(
  activity: Pick<ScheduleActivity, 'id' | 'status'>,
  dayActivities: Array<Pick<ScheduleActivity, 'id' | 'status'>>
): boolean {
  if (activity.status !== 'skipped') {
    return false
  }

  const index = dayActivities.findIndex((candidate) => candidate.id === activity.id)

  return dayActivities
    .slice(index + 1)
    .every((later) => later.status === 'planned' || later.status === 'skipped')
}

/**
 * Which clock controls an activity shows, from its status and its place in
 * the day. Only someone who can control the clock gets any. Activities start
 * in strict order, so Iniciar never shows on a later planned activity, even
 * though the design draws it on every row.
 */
export function activityControls(
  activity: Pick<ScheduleActivity, 'id' | 'status'>,
  context: ActivityControlContext,
  canControl: boolean
): ActivityControls {
  return {
    start: canControl && activity.status === 'planned' && activity.id === context.nextPlannedId,
    finish: canControl && activity.status === 'running',
    skip: canControl && activity.status === 'planned',
    undoStart: canControl && activity.status === 'running',
    reopen: canControl && activity.status === 'done' && activity.id === context.reopenableId,
    undoSkip: canControl && canUndoSkip(activity, context.dayActivities),
  }
}

/**
 * The finished activity Reabrir applies to: the event's most recently
 * finished one, and only while nothing runs. Null otherwise.
 */
export function reopenableActivity<T extends Pick<ScheduleActivity, 'status' | 'actualEndedAt'>>(
  activities: T[]
): T | null {
  if (runningActivity(activities)) {
    return null
  }

  let latest: T | null = null

  for (const activity of activities) {
    if (
      activity.status === 'done' &&
      activity.actualEndedAt &&
      (!latest?.actualEndedAt ||
        Date.parse(activity.actualEndedAt) > Date.parse(latest.actualEndedAt))
    ) {
      latest = activity
    }
  }

  return latest
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
