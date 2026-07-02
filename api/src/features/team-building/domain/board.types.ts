import type { SubscriptionStatus } from '../../../modules/subscription/domain/subscription.types.ts'

export type ExperienceType = 'newbie' | 'experienced' | 'experienced_outsider'

export type TeamBoardColumnKind = 'unassigned' | 'waiting_list' | 'team'

export type TeamBoardMember = {
  subscriptionId: string
  userId: string
  name: string
  /** The user's nickname, falling back to their first name when unset. */
  nickname: string
  phone: string | null
  experienceType: ExperienceType
  /** Skill-derived labels shown inline on the card (e.g. ["Música", "Canto"]). */
  areas: string[]
  /** Names of the team instances the member signed up for. */
  preferences: string[]
}

export type TeamBoardColumn = {
  /** 'unassigned' | 'waiting_list' for the fixed columns, or the team instance id. */
  id: string
  kind: TeamBoardColumnKind
  title: string
  description?: string
  count: number
  /** Capacity for team columns; absent for the fixed columns. */
  max?: number
  members: TeamBoardMember[]
}

export type TeamBoard = {
  columns: TeamBoardColumn[]
}

export type AssignmentTarget =
  | { kind: 'team'; teamInstanceId: string }
  | { kind: 'waiting_list' }
  | { kind: 'unassigned' }

export type AssignmentChange = {
  userId: string
  target: AssignmentTarget
}

// Statuses that surface on the board when the member has no team membership.
export const UNASSIGNED_STATUS: SubscriptionStatus = 'received'
export const WAITING_LIST_STATUS: SubscriptionStatus = 'waiting_list'

// Coordinator slots for a team instance — three nullable positional slots.
export type CoordinatorSlots = {
  first: string | null
  second: string | null
  third: string | null
}

// A person eligible to be selected as a coordinator for a given team.
export type Candidate = {
  userId: string
  name: string
  /** Nickname, falling back to the user's first name when unset. */
  nickname: string
  experienceType: ExperienceType
  /** Skill-derived labels (e.g. ["Música", "Canto"]). */
  areas: string[]
  /** Raw team-instance IDs from the subscription's team preferences. */
  preferenceTeamIds: string[]
  /** Resolved names for preferenceTeamIds. */
  preferences: string[]
}

export type CandidateListResult = {
  team: { id: string; name: string }
  /** Current coordinator slots with positional nulls preserved. */
  currentCoordinators: CoordinatorSlots
  candidates: Candidate[]
}
