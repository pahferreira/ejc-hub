export type ExperienceType = 'newbie' | 'experienced' | 'experienced_outsider'

export type TeamBoardColumnKind = 'unassigned' | 'waiting_list' | 'team'

export type TeamBoardMember = {
  subscriptionId: string
  userId: string
  name: string
  nickname: string
  phone: string | null
  /** Profile photo URL; null when unset. */
  pictureUrl: string | null
  experienceType: ExperienceType
  /** Key of the member's circle (newbies only); null when unset. */
  circleKey: string | null
  /** Skill-derived labels shown inline on the card (e.g. ["Música", "Canto"]). */
  areas: string[]
  /** Names of the team instances the member signed up for. */
  preferences: string[]
  /** Days of the week the member is available (e.g. ["monday", "friday"]). */
  weekAvailability: string[]
  /** True when this card is a team coordinator (rendered crowned + non-draggable). */
  isCoordinator?: boolean
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

export type CoordinatorCandidate = {
  userId: string
  name: string
  /** Nickname, falling back to the user's first name when unset. */
  nickname: string
  /** Profile photo URL; null when unset. */
  pictureUrl: string | null
  experienceType: ExperienceType
  /** Key of the candidate's circle (newbies only); null when unset. */
  circleKey: string | null
  /** Skill-derived labels (e.g. ["Música", "Canto"]). */
  areas: string[]
  /** Raw team-instance IDs from the subscription's team preferences. */
  preferenceTeamIds: string[]
  /** Resolved names for preferenceTeamIds. */
  preferences: string[]
  /** Whether the candidate has any prior coordinator experience. */
  hasCoordinatorExperience: boolean
  /** Names of the teams the candidate has coordinated in past events. */
  coordinatorExperienceTeams: string[]
  /** Days of the week the candidate is available (e.g. ["monday", "friday"]). */
  weekAvailability: string[]
}

export type CandidateListResponse = {
  team: { id: string; name: string }
  /** User ids of the team's current coordinators (flat, unordered peer set). */
  currentCoordinators: string[]
  candidates: CoordinatorCandidate[]
}

export const teamBuildingQueryKeys = {
  board: ['team-building', 'board'] as const,
  allCandidates: ['team-building', 'candidates'] as const,
  teamCandidates: (teamInstanceId: string) =>
    [...teamBuildingQueryKeys.allCandidates, teamInstanceId] as const,
}
