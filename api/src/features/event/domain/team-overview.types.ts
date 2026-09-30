import type { TeamCoordinatorSummary } from '../../../modules/team-membership/domain/TeamMembershipRepository.ts'
import type { MemberFeeStanding } from '../../../modules/event-fee-payment/domain/fee-payment-status.ts'
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

/**
 * A person on a team detail roster: a `TeamPerson` plus their event-fee standing.
 *
 * Extends rather than widening `TeamPerson` because the team-building board maps
 * the same subscription shape (`mapSubscriptionToPerson`) without ever loading
 * fee data. Putting `eventFeeStatus` on `TeamPerson` itself would force that
 * board to invent a value it has no query for.
 *
 * `eventFeeStatus` is not nullable: a person only reaches this roster by having
 * a subscription in the event (`#buildTeamDetail` drops roster ids with no
 * matching subscription), and `toMemberFeeStanding` maps a missing payment row
 * to `pending`. There is no third answer to represent.
 */
export type TeamRosterPerson = TeamPerson & {
  eventFeeStatus: MemberFeeStanding
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
  /**
   * The team's coordinators, a flat peer set with no rank — packed, so unfilled
   * slots are absent rather than represented as holes. Ordered by nickname like
   * every other roster; the position carries no meaning beyond that.
   */
  coordinators: TeamRosterPerson[]
  /** The team's members, ordered by nickname. */
  members: TeamRosterPerson[]
}
