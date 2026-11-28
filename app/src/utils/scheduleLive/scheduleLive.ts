import { computeDayForecast } from '../../../../common/schedule/computeDayForecast'
import type { ForecastActivity } from '../../../../common/schedule/schedule.types'
import type { ScheduleActivity, ScheduleDay } from '../../services/schedule/schedule.types'
import { isMyTeamActivity } from '../scheduleTimeline/scheduleTimeline'

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

/** An activity's Previsão: when it is now expected to start and end. */
export type ActivityForecast = {
  forecastStartsAt: Date
  forecastEndsAt: Date
}

/** One day's forecast, as the Cronograma reads it. */
export type ScheduleDayForecast = {
  /** The day's Atraso in minutes: positive behind, negative ahead. May be fractional. */
  driftMinutes: number
  /** Each of the day's activities' Previsão, by activity id. */
  byActivityId: Map<string, ActivityForecast>
}

/** The shape `computeDayForecast` reads, carrying the activity it came from. */
type ForecastInput = ForecastActivity & { source: ScheduleActivity }

function toForecastInput(activity: ScheduleActivity): ForecastInput {
  const base = {
    id: activity.id,
    plannedStartsAt: new Date(activity.plannedStartsAt),
    durationMinutes: activity.durationMinutes,
    adjustedDurationMinutes: activity.adjustedDurationMinutes,
    source: activity,
  }
  // The API always sends a running activity's start and a done one's start
  // and end; the planned times stand in should one ever be missing.
  const actualStartsAt = new Date(activity.actualStartedAt ?? activity.plannedStartsAt)

  switch (activity.status) {
    case 'running':
      return { ...base, status: 'running', actualStartsAt }
    case 'done':
      return {
        ...base,
        status: 'done',
        actualStartsAt,
        actualEndsAt: activity.actualEndedAt
          ? new Date(activity.actualEndedAt)
          : new Date(actualStartsAt.getTime() + activity.effectiveDurationMinutes * 60_000),
      }
    default:
      return { ...base, status: activity.status }
  }
}

/**
 * A day's forecast at `now` (the server's clock): every activity's Previsão
 * and the day's Atraso, from `computeDayForecast`, the one source of the
 * delay rules.
 */
export function forecastScheduleDay(
  day: Pick<ScheduleDay, 'activities'>,
  now: Date
): ScheduleDayForecast {
  const forecast = computeDayForecast({ activities: day.activities.map(toForecastInput) }, now)

  return {
    driftMinutes: forecast.driftMinutes,
    byActivityId: new Map(
      forecast.activities.map((activity) => [
        activity.id,
        { forecastStartsAt: activity.forecastStartsAt, forecastEndsAt: activity.forecastEndsAt },
      ])
    ),
  }
}

/**
 * "Próxima da sua equipe": the viewer's team's first planned activity from
 * the Próxima one on, in event order. Null when the viewer has no team, when
 * nothing is next, when the team has nothing left, or when the Próxima one
 * is already the team's.
 */
export function teamNextActivity(
  eventActivities: ScheduleActivity[],
  next: ScheduleActivity | null,
  myTeamInstanceId: string | null
): ScheduleActivity | null {
  if (!next || myTeamInstanceId === null) return null

  const teamNext =
    eventActivities
      .slice(eventActivities.indexOf(next))
      .find(
        (activity) => activity.status === 'planned' && isMyTeamActivity(activity, myTeamInstanceId)
      ) ?? null

  return teamNext?.id === next.id ? null : teamNext
}

/** The whole event's forecast: every activity's Previsão and each day's Atraso. */
export type ScheduleForecast = {
  byActivityId: Map<string, ActivityForecast>
  driftMinutesByDayId: Map<string, number>
}

/** Each day forecast on its own (the drift resets every day), then merged. */
export function forecastSchedule(
  days: Array<Pick<ScheduleDay, 'id' | 'activities'>>,
  now: Date
): ScheduleForecast {
  const forecast: ScheduleForecast = { byActivityId: new Map(), driftMinutesByDayId: new Map() }

  for (const day of days) {
    const dayForecast = forecastScheduleDay(day, now)
    forecast.driftMinutesByDayId.set(day.id, dayForecast.driftMinutes)
    dayForecast.byActivityId.forEach((activityForecast, activityId) =>
      forecast.byActivityId.set(activityId, activityForecast)
    )
  }

  return forecast
}
