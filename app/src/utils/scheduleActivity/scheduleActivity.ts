import { toEventInstant } from '../../../../common/schedule/toEventInstant'
import { toEventTime } from '../../../../common/schedule/toEventTime'
import { toEventDate } from '../../../../common/schedule/toEventDate'
import type { ScheduleActivityBody, ScheduleActivity } from '../../services/schedule/schedule.types'
import type { ScheduleActivityFormValues } from './scheduleActivityForm.schema'

const MINUTE_MS = 60_000

/** The default start and duration for the first activity of an empty day. */
export const DEFAULT_ACTIVITY_START = '06:00'
export const DEFAULT_ACTIVITY_DURATION = 30

export type { ScheduleActivityFormValues }

/** The end instant of an activity: its start plus its duration. */
function endInstant(activity: Pick<ScheduleActivity, 'plannedStartsAt' | 'durationMinutes'>): Date {
  return new Date(
    new Date(activity.plannedStartsAt).getTime() + activity.durationMinutes * MINUTE_MS
  )
}

/** An activity's start on the São Paulo clock: `18:00`. */
export function activityStartTime(activity: Pick<ScheduleActivity, 'plannedStartsAt'>): string {
  return toEventTime(new Date(activity.plannedStartsAt))
}

/** An activity's end on the São Paulo clock: `18:30`. */
export function activityEndTime(
  activity: Pick<ScheduleActivity, 'plannedStartsAt' | 'durationMinutes'>
): string {
  return toEventTime(endInstant(activity))
}

/**
 * The `HH:mm` a start plus a duration lands on, wrapping past midnight. Empty
 * when the start is not a valid `HH:mm`, so the live "Termina às" can hide.
 */
export function endTimeLabel(startTime: string, durationMinutes: number): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(startTime)
  if (!match || !Number.isFinite(durationMinutes)) {
    return ''
  }

  const startMinutes = Number(match[1]) * 60 + Number(match[2])
  const total = (((startMinutes + durationMinutes) % 1440) + 1440) % 1440
  const hours = Math.floor(total / 60)
  const minutes = total % 60

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

/**
 * A duration as a card labels it: `30 min`, `1h`, `1h15`. Whole hours drop the
 * minutes; a remainder is zero-padded to two digits.
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }

  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60

  return rest === 0 ? `${hours}h` : `${hours}h${String(rest).padStart(2, '0')}`
}

/** A day's activities boiled down to what the summary line under its heading needs. */
export type DaySummary = {
  /** `HH:mm` of the earliest start. */
  firstStart: string
  /** `HH:mm` of the latest end. */
  lastEnd: string
  /** Whether the last end falls on the day after: the "(dia seguinte)" flag. */
  nextDay: boolean
  count: number
}

/**
 * The summary of one day's activities, or `null` when the day is empty.
 *
 * The last end is the latest of every activity's end, so a long activity that
 * ends after a later-starting short one still sets it. `nextDay` is true when
 * that end lands on the São Paulo date after the day's own.
 */
export function summarizeDay(activities: ScheduleActivity[], dayDate: string): DaySummary | null {
  if (activities.length === 0) {
    return null
  }

  const starts = activities.map((activity) => new Date(activity.plannedStartsAt))
  const firstStartInstant = starts.reduce((min, start) => (start < min ? start : min), starts[0])

  const ends = activities.map(endInstant)
  const lastEndInstant = ends.reduce((max, end) => (end > max ? end : max), ends[0])

  return {
    firstStart: toEventTime(firstStartInstant),
    lastEnd: toEventTime(lastEndInstant),
    nextDay: toEventDate(lastEndInstant) !== dayDate,
    count: activities.length,
  }
}

/** The summary line: `Das 18:00 às 18:30 · 1 atividade`. */
export function formatDaySummary(summary: DaySummary): string {
  const suffix = summary.nextDay ? ' (dia seguinte)' : ''
  const noun = summary.count === 1 ? 'atividade' : 'atividades'

  return `Das ${summary.firstStart} às ${summary.lastEnd}${suffix} · ${summary.count} ${noun}`
}

/**
 * The start a day's "Adicionar atividade" row suggests: the end of the last
 * activity, so activities chain back to back. `08:00` for an empty day.
 */
export function suggestedNextStart(activities: ScheduleActivity[]): string {
  const summary = summarizeDay(activities, '')
  return summary ? summary.lastEnd : DEFAULT_ACTIVITY_START
}

/** A free interval between two of a day's activities, as its gap row shows it. */
export type ActivityGap = {
  /** The activity the gap follows, so the row renders right under its card. */
  afterActivityId: string
  /** `HH:mm` on the São Paulo clock: the earlier activity's end. */
  startTime: string
  /** `HH:mm` on the São Paulo clock: the later activity's start. */
  endTime: string
  durationMinutes: number
}

/**
 * The free intervals between a day's activities, earliest first. Back-to-back
 * activities leave no gap, and nothing follows the last one, so a last activity
 * that runs past midnight adds none.
 */
export function activityGaps(activities: ScheduleActivity[]): ActivityGap[] {
  const sorted = [...activities].sort(
    (a, b) => new Date(a.plannedStartsAt).getTime() - new Date(b.plannedStartsAt).getTime()
  )

  return sorted.slice(1).flatMap((next, index) => {
    const previous = sorted[index]
    const gapStart = endInstant(previous)
    const gapEnd = new Date(next.plannedStartsAt)
    const durationMinutes = Math.round((gapEnd.getTime() - gapStart.getTime()) / MINUTE_MS)

    if (durationMinutes <= 0) {
      return []
    }

    return [
      {
        afterActivityId: previous.id,
        startTime: toEventTime(gapStart),
        endTime: toEventTime(gapEnd),
        durationMinutes,
      },
    ]
  })
}

/** The edit form's values, pre-filled from the activity it edits. */
export function activityFormValues(activity: ScheduleActivity): ScheduleActivityFormValues {
  return {
    title: activity.title,
    startTime: activityStartTime(activity),
    durationMinutes: activity.durationMinutes,
    place: activity.place,
    teamInstanceIds: activity.teams.map((team) => team.teamInstanceId),
    guestName: activity.guestName ?? '',
    adminsResponsible: activity.adminsResponsible,
    allTeams: activity.allTeams,
  }
}

/**
 * Turns the form's values into the request body. The `HH:mm` start becomes an
 * ISO instant through the shared São Paulo helper, so the device's own time
 * zone never shifts it. Empty text fields become `null`/trimmed.
 */
export function buildActivityBody(
  dayId: string,
  dayDate: string,
  values: ScheduleActivityFormValues
): ScheduleActivityBody {
  const guestName = values.guestName.trim()

  return {
    dayId,
    title: values.title.trim(),
    plannedStartsAt: toEventInstant(dayDate, values.startTime).toISOString(),
    durationMinutes: values.durationMinutes,
    place: values.place.trim(),
    teamInstanceIds: values.teamInstanceIds,
    guestName: guestName === '' ? null : guestName,
    adminsResponsible: values.adminsResponsible,
    allTeams: values.allTeams,
  }
}
