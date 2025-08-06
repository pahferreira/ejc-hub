type SubscriptionStatus = 'pending' | 'received' | 'completed' | 'waiting_list'

export type SubscriptionWithDetails = {
  id: string
  status: SubscriptionStatus
  teams: string[]
  user: {
    name: string
    phone: string | null
  }
}
