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
