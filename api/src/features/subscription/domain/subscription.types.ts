type SubscriptionStatus = 'pending' | 'received' | 'completed' | 'waiting_list'

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
