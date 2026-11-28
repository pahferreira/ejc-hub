import { toEventTime } from '../../../../common/schedule/toEventTime'
import type { ScheduleActivity } from '../../services/schedule/schedule.types'
import { formatDuration } from '../scheduleActivity/scheduleActivity'

const SECOND_MS = 1_000
const MINUTE_MS = 60_000

/** Where the running activity stands against its effective duration at `now`. */
export type RunningClock = {
  /** Time since the actual start. */
  elapsedMs: number
  /** Time left before the effective duration runs out; 0 once it has. */
  remainingMs: number
  /** Time past the effective duration; 0 until it runs out. */
  overrunMs: number
  /** Elapsed over the effective duration, from 0 to 1. */
  progress: number
}

/**
 * The running activity's clock: elapsed, remaining and overrun against its
 * effective duration (a trim when there is one, the planned one otherwise).
 * Before the actual start everything reads 0, so a skewed clock never shows
 * negative time.
 */
export function runningClock(
  activity: Pick<ScheduleActivity, 'actualStartedAt' | 'effectiveDurationMinutes'>,
  now: Date
): RunningClock {
  const durationMs = activity.effectiveDurationMinutes * MINUTE_MS
  const startedAt = activity.actualStartedAt ? new Date(activity.actualStartedAt).getTime() : NaN
  const elapsedMs = Number.isNaN(startedAt) ? 0 : Math.max(0, now.getTime() - startedAt)

  return {
    elapsedMs,
    remainingMs: Math.max(0, durationMs - elapsedMs),
    overrunMs: Math.max(0, elapsedMs - durationMs),
    progress: durationMs > 0 ? Math.min(1, elapsedMs / durationMs) : 1,
  }
}

/**
 * A span as a timer shows it: `05:07`, or `1:02:03` from an hour up. Whole
 * seconds, rounded down; a negative span reads as its size.
 */
export function formatTimer(ms: number): string {
  const totalSeconds = Math.floor(Math.abs(ms) / SECOND_MS)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const mmss = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return hours > 0 ? `${hours}:${mmss}` : mmss
}

/**
 * The "+N min" chip of an overrun: whole minutes, matching "Excedeu em", but
 * at least `+1 min` so it reads as soon as the activity runs over.
 */
export function formatOverrunMinutes(overrunMs: number): string {
  return `+${formatDuration(Math.max(1, Math.floor(overrunMs / MINUTE_MS)))}`
}

/**
 * A drift as its chip shows it, in whole minutes: `+7 min`, `+1h05`, `-10 min`.
 * Zero reads `+0 min`; callers hide the chip instead.
 */
export function formatDriftMinutes(minutes: number): string {
  const rounded = Math.round(minutes)
  const sign = rounded < 0 ? '-' : '+'

  return `${sign}${formatDuration(Math.abs(rounded))}`
}

/** Whether a drift, in whole minutes, puts something late, early or on time. */
export type DriftTone = 'onTime' | 'late' | 'early'

export function driftTone(minutes: number): DriftTone {
  const rounded = Math.round(minutes)
  if (rounded > 0) return 'late'
  if (rounded < 0) return 'early'
  return 'onTime'
}

/** The day's Atraso chip: `Atraso +7 min`, `Adiantado 5 min` or `No horário`. */
export function formatDayDrift(minutes: number): string {
  const rounded = Math.round(minutes)
  if (rounded > 0) return `Atraso +${formatDuration(rounded)}`
  if (rounded < 0) return `Adiantado ${formatDuration(-rounded)}`
  return 'No horário'
}

/**
 * How far off an activity's start is: `em 12 min`, `em 1h05`. Whole minutes,
 * rounded up, so "em 1 min" lasts until the start. `agora` once it is due.
 */
export function formatStartsIn(startsAt: Date, now: Date): string {
  const ms = startsAt.getTime() - now.getTime()
  if (ms <= 0) return 'agora'
  return `em ${formatDuration(Math.ceil(ms / MINUTE_MS))}`
}

/** A next activity's Previsão line: `Começa às 18:20 — em 12 min`. */
export function formatStartsAt(forecastStartsAt: Date, now: Date): string {
  return `Começa às ${toEventTime(roundToMinute(forecastStartsAt))} — ${formatStartsIn(forecastStartsAt, now)}`
}

/**
 * An activity's drift in whole minutes: how far its Previsão is from its
 * planned start. Positive when late.
 */
export function startDriftMinutes(
  activity: Pick<ScheduleActivity, 'plannedStartsAt'>,
  forecastStartsAt: Date
): number {
  return Math.round(
    (forecastStartsAt.getTime() - new Date(activity.plannedStartsAt).getTime()) / MINUTE_MS
  )
}

/** An instant rounded to the nearest minute, so a Previsão reads like its drift chip. */
export function roundToMinute(instant: Date): Date {
  return new Date(Math.round(instant.getTime() / MINUTE_MS) * MINUTE_MS)
}

/**
 * How long a done activity really took, in whole minutes, from its actual
 * times. Its effective duration while either is missing.
 */
export function actualDurationMinutes(
  activity: Pick<ScheduleActivity, 'actualStartedAt' | 'actualEndedAt' | 'effectiveDurationMinutes'>
): number {
  if (!activity.actualStartedAt || !activity.actualEndedAt) {
    return activity.effectiveDurationMinutes
  }

  const ms =
    new Date(activity.actualEndedAt).getTime() - new Date(activity.actualStartedAt).getTime()
  return Math.max(0, Math.round(ms / MINUTE_MS))
}
