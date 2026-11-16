import type {
  DayForecast,
  ForecastActivity,
  ForecastDay,
  ForecastedActivity,
} from './schedule.types.ts'

const MINUTE_MS = 60_000

const addMinutes = (instant: Date, minutes: number): Date =>
  new Date(instant.getTime() + minutes * MINUTE_MS)

/** Forecast start and end of one activity, given the drift carried into it. */
const forecastTimes = (activity: ForecastActivity, driftMs: number, now: Date) => {
  const effectiveMinutes = activity.adjustedDurationMinutes ?? activity.durationMinutes
  const driftedStartsAt = new Date(activity.plannedStartsAt.getTime() + driftMs)
  switch (activity.status) {
    case 'done':
      return { forecastStartsAt: activity.actualStartsAt, forecastEndsAt: activity.actualEndsAt }
    case 'running': {
      const endsAt = addMinutes(activity.actualStartsAt, effectiveMinutes)
      return {
        forecastStartsAt: activity.actualStartsAt,
        forecastEndsAt: new Date(Math.max(endsAt.getTime(), now.getTime())),
      }
    }
    case 'skipped':
      return { forecastStartsAt: driftedStartsAt, forecastEndsAt: driftedStartsAt }
    case 'planned':
      return {
        forecastStartsAt: driftedStartsAt,
        forecastEndsAt: addMinutes(driftedStartsAt, effectiveMinutes),
      }
  }
}

/**
 * The Running Schedule's forecast for one day: the single source of the delay
 * rules. One pass in planned order, carrying a drift that starts at 0 each day:
 *
 * - `done`: the actual times.
 * - `running`: actual start to `max(actual start + effective duration, now)`,
 *   so an overrun grows live.
 * - `skipped`: zero time at `planned start + drift`.
 * - `planned`: `planned start + drift` (gaps kept) plus the effective duration.
 *
 * Effective duration is `adjustedDurationMinutes ?? durationMinutes`; planned
 * end always uses `durationMinutes`. After each activity the drift becomes
 * `forecast end − planned end`. Pure instant maths, so it reads the same in
 * any time zone.
 */
export const computeDayForecast = <T extends ForecastActivity>(
  day: ForecastDay<T>,
  now: Date
): DayForecast<T> => {
  const ordered = [...day.activities].sort(
    (a, b) => a.plannedStartsAt.getTime() - b.plannedStartsAt.getTime()
  )

  let driftMs = 0
  let driftBeforeNextPlannedMs: number | null = null
  const activities: ForecastedActivity<T>[] = ordered.map((activity) => {
    if (activity.status === 'planned' && driftBeforeNextPlannedMs === null)
      driftBeforeNextPlannedMs = driftMs
    const times = forecastTimes(activity, driftMs, now)
    const plannedEndsAt = addMinutes(activity.plannedStartsAt, activity.durationMinutes)
    driftMs = times.forecastEndsAt.getTime() - plannedEndsAt.getTime()
    return { ...activity, ...times }
  })

  return {
    activities,
    driftMinutes: (driftBeforeNextPlannedMs ?? driftMs) / MINUTE_MS,
    running: activities.find((activity) => activity.status === 'running') ?? null,
    next: activities.find((activity) => activity.status === 'planned') ?? null,
  }
}
