export type SubscriptionStatus = 'pending' | 'received' | 'completed' | 'waiting_list'

export type SubscriptionWithDetails = {
  id: string
  status: SubscriptionStatus
  createdAt: string
  teams: string[]
  user: {
    name: string
    email: string
    phone: string | null
  }
}

export type SubscriptionStats = {
  total: number
  pending: number
  approved: number
  completed: number
  waitingList: number
}
