import type { SettableFeeStatus } from '../../../modules/event-fee-payment/domain/fee-payment-status.ts'

export type TeamFeeRow = {
  teamId: string
  teamKey: string
  teamName: string
  total: number
  /** Members whose money came in. Comped members are in `exempt`, not here. */
  paid: number
  exempt: number
  /** Everyone still owing: `total - paid - exempt`. */
  pending: number
  /** 0–100, rounded here so every client reads the same number. */
  paidPercentage: number
}

/**
 * The three ways a member's fee can stand, counted separately.
 *
 * `paid`, `exempt` and `pending` partition the roster — they always sum to
 * `totalMembers` — which is why `paid` counts money received only. Folding the
 * comped members into it would make the count disagree with `collectedCents`,
 * and a treasurer reconciling a bank statement against this page is exactly the
 * person who would notice.
 */
export type EventFeeCounts = {
  /** Team memberships in the event, coordinators included. */
  totalMembers: number
  paidCount: number
  exemptCount: number
  pendingCount: number
}

export type FeeStatusUpdateResult = {
  /** The user ids whose payment record was actually written. */
  updatedUserIds: string[]
  updatedCount: number
}

/**
 * The three buckets as shares of the roster rather than head counts.
 *
 * Always sum to exactly 100 (or all-zero for an empty event), because the page
 * shows them as three cards side by side where a stray 99 or 101 is visible.
 * `toFeeRates` is what guarantees it.
 */
export type EventFeeRates = {
  paidPercentage: number
  exemptPercentage: number
  pendingPercentage: number
}

/**
 * What the "Taxa por Membro" page's cards read: the head counts and the same
 * three rates the by-team page gets.
 *
 * Both, because that page shows both — "10 pagos" and "44% do evento" sit on one
 * card. The rates come from `toFeeRates` rather than being derived per card,
 * which is what stops "pendentes" from being rendered as `100 - paidPercentage`
 * and quietly counting the exempt members as outstanding.
 *
 * No per-team breakdown: this page lists people across every team, so that would
 * be a payload it never renders.
 */
export type EventFeeMembersOverview = EventFeeCounts & EventFeeRates

/**
 * What the "Taxa de Inscrição" page reads: the rates, the per-team breakdown its
 * table renders, and the money.
 *
 * No head counts and no `totalMembers`: this page answers "how is the event
 * doing", which is a proportion, and the per-team table below it already carries
 * the absolute numbers for anyone who wants them. The by-member page is where
 * the roster size is the point.
 */
export type EventFeeTeamsOverview = EventFeeRates & {
  /** Sum of what actually came in, from the per-payment snapshots. */
  collectedCents: number
  /**
   * What the event should raise: its fee times everyone who owes it. Comped
   * members are excluded rather than counted at zero — the target a treasurer
   * chases is the money still reachable, not a number no exemption can ever
   * close.
   */
  expectedCents: number
  /** ISO code from the event, so the client never hardcodes a symbol. */
  currency: string
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

export type EventFeeMemberList = {
  items: EventFeeMemberRow[]
  /** Members matching the filters, across every page. */
  total: number
  page: number
  pageSize: number
}
