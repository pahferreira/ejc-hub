import type {
  TeamMembershipInput,
  TeamMembershipModel,
} from '../../../core/database/schemas/index.ts'
import type { DbExecutor } from '../../../core/database/client.ts'

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

export interface TeamMembershipRepository {
  insertTeamMembership: (
    input: TeamMembershipInput,
    executor?: DbExecutor
  ) => Promise<TeamMembershipModel | undefined>
  selectTeamMembership: (id: string) => Promise<TeamMembershipModel | undefined>
  listTeamMemberships: () => Promise<TeamMembershipModel[]>
  deleteTeamMembership: (id: string, executor?: DbExecutor) => Promise<TeamMembershipModel>
  selectByMemberAndTeam: (
    teamId: string,
    memberId: string
  ) => Promise<TeamMembershipModel | undefined>
  deleteByMemberAndTeam: (
    teamId: string,
    memberId: string,
    executor?: DbExecutor
  ) => Promise<TeamMembershipModel | undefined>
  listMemberUserIdsByTeamInstanceIds: (teamInstanceIds: string[]) => Promise<Map<string, string[]>>
  /** The user ids of a team's coordinators (a flat, unordered peer set). */
  getCoordinatorUserIds: (teamInstanceId: string) => Promise<string[]>
  setCoordinators: (
    teamInstanceId: string,
    coordinatorUserIds: string[],
    executor?: DbExecutor
  ) => Promise<void>
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
}
