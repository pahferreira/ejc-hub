import type { SettableFeeStatus } from '../../../modules/event-fee-payment/domain/fee-payment-status.ts'

export type TeamFeeRow = {
  teamId: string
  teamKey: string
  teamName: string
  total: number
  paid: number
  pending: number
  /** 0–100, rounded here so every client reads the same number. */
  paidPercentage: number
}

export type FeeStatusUpdateResult = {
  /** The user ids whose payment record was actually written. */
  updatedUserIds: string[]
  updatedCount: number
}

export type EventFeeOverview = {
  /** Team memberships in the event, coordinators included. */
  totalMembers: number
  paidCount: number
  pendingCount: number
  paidPercentage: number
  teams: TeamFeeRow[]
}

/** Whether a member has settled their fee. `exempt` reads as `paid`. */
export type MemberFeeStanding = 'paid' | 'pending'

/**
 * One member of one team, with their fee standing in the current event.
 *
 * Where `TeamFeeRow` rolls a team up for the organisers' overview, this is the
 * per-person row the "Taxa por Membro" page lists and acts on.
 */
export type EventFeeMemberRow = {
  userId: string
  name: string
  /** The person's nickname, falling back to their first name when unset. */
  nickname: string
  phone: string | null
  pictureUrl: string | null
  experienceType: 'newbie' | 'experienced' | 'experienced_outsider'
  /** Key of the person's circle (newbies only); null when unset. */
  circleKey: string | null
  membershipType: 'member' | 'coordinator'
  teamId: string
  teamKey: string
  teamName: string
  status: MemberFeeStanding
  /**
   * The stored payment status, unfolded.
   *
   * Carried *alongside* `status` rather than instead of it: `status` is what the
   * filters, the stat cards and the row pill read, and collapsing it here once
   * is what keeps every one of them agreeing with `aggregateFeeStatusByTeam`.
   * This field exists for the review dialog, which has to preselect the member's
   * actual status and so must tell `exempt` from `paid`.
   */
  paymentStatus: SettableFeeStatus
}

export type EventFeeMemberFilters = {
  /** Case- and accent-insensitive substring of the full name or nickname. */
  name?: string
  /** `team_templates.key`; the stable identifier a team keeps across events. */
  teamKey?: string
  status?: MemberFeeStanding
}

export type EventFeeMemberPagination = {
  page?: number
  pageSize?: number
}

/**
 * Counts for the page's stat cards.
 *
 * Computed over the *filtered* set, not the whole event: the cards sit directly
 * above the list and read as a summary of what is on screen, so "Membros
 * Listados" and the pagination total are by definition the same number.
 */
export type EventFeeMemberStats = {
  totalMembers: number
  paidCount: number
  pendingCount: number
  /** 0–100, rounded here so every client reads the same number. */
  paidPercentage: number
}

export type EventFeeMemberList = {
  items: EventFeeMemberRow[]
  /** Members matching the filters, across every page. */
  total: number
  page: number
  pageSize: number
  stats: EventFeeMemberStats
}
