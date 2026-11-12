import { toEventDate } from '../../../../common/schedule/toEventDate'
import { toEventPeriod, type EventPeriod } from '../../../../common/schedule/toEventPeriod'
import type { ScheduleActivity, ScheduleDay } from '../../services/schedule/schedule.types'

/**
 * The id of the day the Cronograma opens on: today's day during the event (on
 * the São Paulo clock), the first day otherwise. Null when no days are planned.
 */
export function defaultDayId(
  days: Array<Pick<ScheduleDay, 'id' | 'date'>>,
  now: Date
): string | null {
  const today = toEventDate(now)
  const todayDay = days.find((day) => day.date === today)

  return (todayDay ?? days[0])?.id ?? null
}

/** One "Linha do tempo" section: a period's heading and its activities. */
export type SchedulePeriodGroup = {
  period: EventPeriod
  label: string
  activities: ScheduleActivity[]
}

const PERIODS: Array<{ period: EventPeriod; label: string }> = [
  { period: 'morning', label: 'Manhã' },
  { period: 'afternoon', label: 'Tarde' },
  { period: 'night', label: 'Noite' },
]

/**
 * A day's activities split into Manhã, Tarde and Noite, each keeping the order
 * it was given (earliest first, as the API sends them). Empty periods are left out.
 */
export function groupActivitiesByPeriod(
  activities: ScheduleActivity[],
  dayDate: string
): SchedulePeriodGroup[] {
  return PERIODS.map(({ period, label }) => ({
    period,
    label,
    activities: activities.filter(
      (activity) => toEventPeriod(new Date(activity.plannedStartsAt), dayDate) === period
    ),
  })).filter((group) => group.activities.length > 0)
}

/** Whether the user's team is among those responsible for an activity; every team is, when it's an all-teams one. */
export function isMyTeamActivity(
  activity: Pick<ScheduleActivity, 'teams' | 'allTeams'>,
  myTeamInstanceId: string | null
): boolean {
  return (
    myTeamInstanceId !== null &&
    (activity.allTeams || activity.teams.some((team) => team.teamInstanceId === myTeamInstanceId))
  )
}
