import type { ExperienceType } from '../team-building/team-building.types'

export type TeamStatus = 'needsMembers' | 'spotsAvailable' | 'complete'

/**
 * How a person belongs to a team. Mirrors the `team_membership_type` Postgres
 * enum (`api/src/core/database/schemas/team-memberships.ts`), which is the
 * source of truth: coordinators are `team_memberships` rows with
 * `type = 'coordinator'`, a flat peer set with no rank between them.
 *
 * Deliberately not `CandidateRole` from `team-building.types`: that union is
 * structurally identical but means "which role the candidate list is being
 * fetched for", so widening it for a search feature must not silently widen
 * how membership is modelled.
 */
export type TeamMembershipType = 'member' | 'coordinator'

export const teamOptionsQueryKeys = {
  all: ['team-options'] as const,
}

export type TeamsListFilters = {
  name?: string
  status?: Extract<TeamStatus, 'needsMembers' | 'complete'>
}

export const teamsOverviewQueryKeys = {
  stats: ['teams', 'overview', 'stats'] as const,
  lists: ['teams', 'overview', 'list'] as const,
  list: (filters: TeamsListFilters = {}) => [...teamsOverviewQueryKeys.lists, filters] as const,
  detail: (teamKey: string) => ['teams', 'detail', teamKey] as const,
  myTeam: ['teams', 'me'] as const,
}

export type TeamOption = {
  key: string
  name: string
  description: string
}

export type TeamCoordinatorSummary = {
  id: string
  name: string
  /** Profile photo URL; null when unset. */
  pictureUrl: string | null
}

export type TeamOverview = {
  id: string
  templateKey: string
  templateName: string
  templateDescription: string | null
  memberCount: number
  maxCapacity: number
  coordinators: TeamCoordinatorSummary[]
}

export type TeamsOverviewStats = {
  completed: number
  partiallyCompleted: number
  inRisk: number
  total: number
}

export type TeamPerson = {
  userId: string
  name: string
  /** The person's nickname, falling back to their first name when unset. */
  nickname: string
  phone: string | null
  /** Profile photo URL; null when unset. */
  pictureUrl: string | null
  experienceType: ExperienceType
  /** Key of the person's circle (newbies only); null when unset. */
  circleKey: string | null
  /** Skill-derived labels (e.g. ["Música", "Canto"]). */
  areas: string[]
  /** Names of the team instances the person signed up for. */
  preferences: string[]
  /** Days of the week the person is available (e.g. ["monday", "friday"]). */
  weekAvailability: string[]
}

export type TeamDetail = {
  id: string
  templateKey: string
  name: string
  description: string | null
  memberCount: number
  maxCapacity: number
  freeSlots: number
  filledPercentage: number
  /** Total number of coordinator slots a team can have. */
  coordinatorSlots: number
  /** Slot-ordered coordinators (0..coordinatorSlots), unfilled slots omitted. */
  coordinators: TeamPerson[]
  members: TeamPerson[]
}
