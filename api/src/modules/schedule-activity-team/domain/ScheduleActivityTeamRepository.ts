import type { DbExecutor } from '../../../core/database/client.ts'

/** One team tied to an activity, with its template name and key for the card. */
export type ScheduleActivityTeamRow = {
  activityId: string
  teamInstanceId: string
  teamName: string
  teamKey: string
}

export interface ScheduleActivityTeamRepository {
  /** Every activity-team of one event, so the read can group them by activity. */
  listTeamsByEvent: (eventId: string) => Promise<ScheduleActivityTeamRow[]>

  /**
   * Ties one or more teams to an activity. Accepts an executor so it shares the
   * transaction that wrote the activity. A no-op when there are no teams.
   */
  insertTeams: (
    activityId: string,
    teamInstanceIds: string[],
    eventId: string,
    executor?: DbExecutor
  ) => Promise<void>
}
