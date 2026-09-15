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

/**
 * A stored event-fee payment status, as the treasurer can set it.
 *
 * Mirrors the API's `SETTABLE_FEE_STATUSES`. Where `TeamMemberFeeStatus` is the
 * two-state fold a list acts on, this is the full set a review dialog has to
 * distinguish — `exempt` and `paid` both read as settled, but comping someone
 * and receiving their money are not the same decision.
 *
 * `refunded` is absent for the same reason it is absent on the API: the table
 * has nowhere to record when the money went back out, so no screen can set it.
 * A refunded row arrives here as `pending`.
 */
export type MemberFeePaymentStatus = 'pending' | 'not_paid' | 'paid' | 'exempt'

/**
 * One member's fee standing anywhere in the current event.
 *
 * Extends `TeamMemberFeeRow` rather than restating it: the "Taxa por Membro"
 * page shows the same person the coordinator's own list shows, plus the team
 * they belong to — which the coordinator view never needs, since every row there
 * is already their team. Being a supertype is what lets both pages share
 * `MemberFeeIdentity`, `MemberFeeSelectControl`, `feeMemberSelection` and
 * `feeMemberStats` unchanged.
 */
export type EventFeeMemberRow = TeamMemberFeeRow & {
  teamId: string
  /** `team_templates.key`; stable across events, so it is what filters send. */
  teamKey: string
  teamName: string
  /**
   * The stored status behind the folded `status`, for the review dialog.
   *
   * Only on this row, not on `TeamMemberFeeRow`: a coordinator confirms payments
   * and never comps anyone, so their list has no use for the distinction and
   * should not carry a field nothing reads.
   */
  paymentStatus: MemberFeePaymentStatus
}

export type EventFeeMemberFilters = {
  /** Matches the full name or the nickname, accent-insensitively. */
  name?: string
  teamKey?: string
  status?: TeamMemberFeeStatus
}

export type EventFeeMemberPagination = {
  page?: number
  pageSize?: number
}

/**
 * Counts for the page's stat cards, computed by the API over the *filtered* set.
 * `totalMembers` is therefore the same number as `total` — the cards summarise
 * what the table is showing, not the whole event.
 */
export type EventFeeMemberStats = {
  totalMembers: number
  paidCount: number
  pendingCount: number
  /** 0–100, rounded by the API. Clients must not re-derive it. */
  paidPercentage: number
}

export type EventFeeMemberListResponse = {
  items: EventFeeMemberRow[]
  /** Members matching the filters, across every page. */
  total: number
  page: number
  pageSize: number
  stats: EventFeeMemberStats
}

export const financeQueryKeys = {
  /** Root of everything financial; invalidated after any fee write. */
  all: ['finance'] as const,
  eventFeeOverview: ['finance', 'event-fee', 'overview'] as const,
  eventFeeMembers: ['finance', 'event-fee', 'members'] as const,
  eventFeeMembersList: (filters: EventFeeMemberFilters, pagination: EventFeeMemberPagination) =>
    ['finance', 'event-fee', 'members', filters, pagination] as const,
}
