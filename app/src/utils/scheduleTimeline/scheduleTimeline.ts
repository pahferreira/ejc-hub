import { toEventDate } from '../../../../common/schedule/toEventDate'
import { eventZoneParts } from '../../../../common/schedule/eventZoneParts'
import type { ScheduleActivity, ScheduleDay } from '../../services/schedule/schedule.types'
import type { TeamMembershipType } from '../../services/teams/teams.types'

/**
 * The day tab the Cronograma opens on: today's day during the event (on the São
 * Paulo clock), the first day otherwise. Null when no days are planned.
 */
export function defaultDayTab(
  days: Array<Pick<ScheduleDay, 'id' | 'date'>>,
  now: Date
): string | null {
  const today = toEventDate(now)
  const todayDay = days.find((day) => day.date === today)

  return (todayDay ?? days[0])?.id ?? null
}

export type SchedulePeriod = 'morning' | 'afternoon' | 'night'

/** One "Linha do tempo" section: a period's heading and its activities. */
export type SchedulePeriodGroup = {
  period: SchedulePeriod
  label: string
  activities: ScheduleActivity[]
}

const PERIODS: Array<{ period: SchedulePeriod; label: string }> = [
  { period: 'morning', label: 'Manhã' },
  { period: 'afternoon', label: 'Tarde' },
  { period: 'night', label: 'Noite' },
]

// Manhã before 12:00, Tarde until 18:00, Noite from 18:00, all on the São Paulo
// clock. A start on a later São Paulo date than the day's is past midnight, and
// stays in its day's Noite rather than jumping back to Manhã.
function periodOf(activity: ScheduleActivity, dayDate: string): SchedulePeriod {
  const start = new Date(activity.plannedStartsAt)

  if (toEventDate(start) > dayDate) {
    return 'night'
  }

  const hour = Number(eventZoneParts(start).hour)

  if (hour < 12) {
    return 'morning'
  }

  return hour < 18 ? 'afternoon' : 'night'
}

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
    activities: activities.filter((activity) => periodOf(activity, dayDate) === period),
  })).filter((group) => group.activities.length > 0)
}

/** Whether the user's team is among those responsible for an activity. */
export function isMyTeamActivity(
  activity: Pick<ScheduleActivity, 'teams'>,
  myTeamInstanceId: string | null
): boolean {
  return (
    myTeamInstanceId !== null &&
    activity.teams.some((team) => team.teamInstanceId === myTeamInstanceId)
  )
}

export type ScheduleViewerRole = 'admin' | 'coordinator' | 'member'

/**
 * The role `schedule_viewed` reports. The team role wins: an admin who is on a
 * team reads the Cronograma as that team does. Only the API lets in someone on
 * no team, so a null membership is an admin.
 */
export function scheduleViewerRole(membershipType: TeamMembershipType | null): ScheduleViewerRole {
  return membershipType ?? 'admin'
}
