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

export type EventMembership = {
  id: string
  teamInstanceId: string
  type: 'member' | 'coordinator'
}

export type MembershipContact = {
  userId: string
  name: string
  nickname: string | null
  phone: string | null
  instagram: string | null
  email: string
  type: 'member' | 'coordinator'
  teamInstanceId: string
  teamName: string
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
  /**
   * The membership a user holds in one event's teams, if any. A user holds at most
   * one per event, so callers can treat a result as "already assigned".
   */
  findMembershipByUserAndEvent: (
    userId: string,
    eventId: string
  ) => Promise<EventMembership | undefined>
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
  /** Removes every membership (member and coordinator) a user holds in one event's teams. */
  deleteMembershipsByUserAndEvent: (
    userId: string,
    eventId: string,
    executor?: DbExecutor
  ) => Promise<void>
  /** Every member and coordinator contact for an event's teams, ordered by name. */
  listEventMembershipContacts: (eventId: string) => Promise<MembershipContact[]>
}
