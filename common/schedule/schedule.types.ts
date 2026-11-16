/**
 * The fields of an activity the forecast reads. Every time is an instant
 * (`timestamptz`, ADR #9). Each status carries the actual times it has, so a
 * `done` activity cannot lack its end.
 */
export type ForecastActivity = {
  id: string
  plannedStartsAt: Date
  /** The planned length. Planned end always uses it. */
  durationMinutes: number
  /** A trim or stretch set during the event; replaces `durationMinutes` in the forecast. */
  adjustedDurationMinutes: number | null
} & (
  | { status: 'planned' | 'skipped' }
  | { status: 'running'; actualStartsAt: Date }
  | { status: 'done'; actualStartsAt: Date; actualEndsAt: Date }
)

export type ForecastActivityStatus = ForecastActivity['status']

/** One day's activities. Order does not matter; the forecast sorts by planned start. */
export type ForecastDay<T extends ForecastActivity = ForecastActivity> = {
  activities: T[]
}

/** An activity with its forecast times added. */
export type ForecastedActivity<T extends ForecastActivity = ForecastActivity> = T & {
  forecastStartsAt: Date
  forecastEndsAt: Date
}

export type DayForecast<T extends ForecastActivity = ForecastActivity> = {
  /** Every activity, earliest planned start first, with its forecast times. */
  activities: ForecastedActivity<T>[]
  /**
   * The day's current drift (Atraso), in minutes: how far the next planned
   * activity is pushed (positive) or pulled (negative). Once nothing is left
   * to start, the drift after the last activity. May be fractional, since
   * actual times carry seconds; rounding is the screen's job.
   */
  driftMinutes: number
  /** The activity in progress, or null. */
  running: ForecastedActivity<T> | null
  /** The first planned activity still to start, or null. */
  next: ForecastedActivity<T> | null
}
