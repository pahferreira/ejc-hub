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

export const financeQueryKeys = {
  eventFeeOverview: ['finance', 'event-fee', 'overview'] as const,
}
