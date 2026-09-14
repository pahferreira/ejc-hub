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
} as const

export type FeatureFlagValue = (typeof FeatureFlag)[keyof typeof FeatureFlag]
