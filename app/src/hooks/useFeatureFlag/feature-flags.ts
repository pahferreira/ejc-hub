export const FeatureFlag = {
  MyTeam: 'current-event-my-team',
  EventFee: 'admin-financials-event-fee',
  Shirts: 'admin-financials-shirts',
} as const

export type FeatureFlagValue = (typeof FeatureFlag)[keyof typeof FeatureFlag]
