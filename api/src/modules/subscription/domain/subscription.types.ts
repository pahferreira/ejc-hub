export const SubscriptionStatus = {
  Pending: 'pending',
  Received: 'received',
  Completed: 'completed',
  WaitingList: 'waiting_list',
} as const

export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus]
