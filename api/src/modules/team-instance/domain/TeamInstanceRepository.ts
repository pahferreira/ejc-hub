import type { TeamInstanceInput, TeamInstanceModel } from '../../../core/database/schemas/index.ts'
import type { DbExecutor } from '../../../core/database/client.ts'

export type AssignedTeamForUser = {
  id: string
  name: string
  description: string | null
}

export type TeamCoordinator = {
  id: string
  name: string
  phone: string | null
}

export type TeamCoordinatorSummary = {
  id: string
  name: string
  /** Profile photo URL; null when unset. */
  pictureUrl: string | null
}

export type TeamInstanceWithDetails = {
  id: string
  eventId: string
  templateKey: string
  templateName: string
  templateDescription: string | null
  maxCapacity: number
}

export interface TeamInstanceRepository {
  selectTeamInstance: (id: string) => Promise<{
    id: string
    description?: string | null
    eventId: string
    name: string
    templateKey: string
  }>
  listTeamInstances: (
    eventId?: string,
    queryParams?: { keys?: string[] }
  ) => Promise<
    {
      id: string
      eventId: string
      name: string
      templateKey: string
    }[]
  >
  listTeamInstancesWithDetails: (eventId: string) => Promise<TeamInstanceWithDetails[]>
  findUserTeamForEvent: (
    userId: string,
    eventId: string
  ) => Promise<AssignedTeamForUser | undefined>
  listTeamCoordinators: (teamInstanceId: string) => Promise<TeamCoordinator[]>
  listCoordinatorIdsByTeamInstanceIds: (teamInstanceIds: string[]) => Promise<Map<string, string[]>>
  /**
   * Maps each given user id to the distinct team names they have coordinated in
   * team instances, optionally excluding a single event (e.g. the current one)
   * so only genuine prior experience is returned.
   */
  listCoordinatorExperienceByUserIds: (
    userIds: string[],
    excludeEventId?: string
  ) => Promise<Map<string, string[]>>
  listCoordinatorsByTeamInstanceIds: (
    teamInstanceIds: string[]
  ) => Promise<Map<string, TeamCoordinatorSummary[]>>
  insertTeamInstance: (input: TeamInstanceInput) => Promise<TeamInstanceModel>
  deleteTeamInstance: (id: string) => Promise<TeamInstanceModel>
  updateTeamInstance: (id: string, input: Partial<TeamInstanceInput>) => Promise<TeamInstanceModel>
  bulkInsertTeamInstances: (eventId: string, templateIds: string[]) => Promise<TeamInstanceModel[]>
  getCoordinatorSlots: (teamInstanceId: string) => Promise<{
    first: string | null
    second: string | null
    third: string | null
  }>
  setCoordinators: (
    teamInstanceId: string,
    slots: { first: string | null; second: string | null; third: string | null },
    executor?: DbExecutor
  ) => Promise<void>
}
