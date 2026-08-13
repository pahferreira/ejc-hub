import type { TeamCoordinatorSummary } from '../../../modules/team-membership/domain/TeamMembershipRepository.ts'
import type { ExperienceType } from './subscription-types.ts'

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

// A person shown on a team detail roster (coordinator or member).
export type TeamPerson = {
  userId: string
  name: string
  /** The user's nickname, falling back to their first name when unset. */
  nickname: string
  phone: string | null
  /** Profile photo URL; null when unset. */
  pictureUrl: string | null
  experienceType: ExperienceType
  /** Key of the person's circle (newbies only); null when unset. */
  circleKey: string | null
  /** Skill-derived labels (e.g. ["Música", "Canto"]). */
  areas: string[]
  /** Free-text observations the subscriber provided; empty string when unset. */
  details: string
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
