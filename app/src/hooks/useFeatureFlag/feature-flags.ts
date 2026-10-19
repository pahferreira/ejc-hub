export const FeatureFlag = {
  MyTeam: 'current-event-my-team',
  EventFee: 'admin-financials-event-fee',
  /**
   * The coordinator's own-team fee page. Separate from `EventFee`, which gates
   * the treasurer's event-wide screens: the two audiences are different, so one
   * can be rolled out without the other.
   */
  CoordinatorEventFee: 'coordinator-financials-event-fee',
  Shirts: 'admin-financials-shirts',
  /**
   * The coordinator's "Solicitar Membros" page. Its own flag, admin-first: the
   * page is useless until admins can answer requests, so the two roll out on
   * separate flags (plan Phase F).
   */
  CoordinatorMemberRequests: 'coordinator-member-requests',
  /**
   * The admin request queue. Turn this on **before**
   * `CoordinatorMemberRequests`: coordinators filing requests nobody can
   * answer makes the feature's first impression a page where nothing happens
   * (plan H.10).
   */
  AdminMemberRequests: 'admin-member-requests',
  /**
   * The coordinator Reuniões page (`/my-team/meetings`). Its own flag so the
   * coordinator read can roll out before the member view (`attendance-visibility`,
   * issue #281) and before any writes.
   */
  CoordinatorAttendance: 'coordinator-attendance',
} as const

export type FeatureFlagValue = (typeof FeatureFlag)[keyof typeof FeatureFlag]
