export const SubscriptionStatus = {
  Pending: 'pending',
  Received: 'received',
  Completed: 'completed',
  WaitingList: 'waiting_list',
} as const

export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus]

export type SubscriptionWithDetails = {
  id: string
  status: SubscriptionStatus
  createdAt: Date
  teams: string[]
  user: {
    name: string
    email: string
    phone: string | null
  }
}
