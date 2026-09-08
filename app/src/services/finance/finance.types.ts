import type { ExperienceType } from '../team-building/team-building.types'
import type { TeamMembershipType } from '../teams/teams.types'

/**
 * One team's event-fee standing within the current event.
 *
 * `paid` folds together the `paid` and `exempt` payment statuses: an exempt
 * member owes nothing, so from the coordination view they are settled. Every
 * other status — plus members with no payment row at all — counts as `pending`,
 * so `paid + pending` always equals `total`.
 */
export type TeamFeeRow = {
  teamId: string
  teamKey: string
  teamName: string
  total: number
  paid: number
  pending: number
  /** 0–100, rounded by the API. Clients must not re-derive it. */
  paidPercentage: number
}

export type EventFeeOverview = {
  /** Team memberships in the event, coordinators included. */
  totalMembers: number
  paidCount: number
  pendingCount: number
  /** 0–100, rounded by the API. */
  paidPercentage: number
  teams: TeamFeeRow[]
}

/**
 * Whether one member has settled their event fee. `paid` folds together the
 * `paid` and `exempt` payment statuses for the same reason `TeamFeeRow` does:
 * an exempt member owes nothing, so from the coordination view they are settled.
 */
export type TeamMemberFeeStatus = 'paid' | 'pending'

/**
 * One member's event-fee standing inside a single team. Where `TeamFeeRow` is a
 * per-team aggregate for the organisers' overview, this is the per-person row a
 * coordinator acts on to confirm payments for their own team.
 */
export type TeamMemberFeeRow = {
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
  /** How the person belongs to the team; coordinators are badged in the list. */
  membershipType: TeamMembershipType
  status: TeamMemberFeeStatus
}

export const financeQueryKeys = {
  eventFeeOverview: ['finance', 'event-fee', 'overview'] as const,
}
