export type SubscriptionStatus = 'pending' | 'received' | 'completed' | 'waiting_list'

export type SubscriptionWithDetails = {
  id: string
  status: SubscriptionStatus
  createdAt: string
  teams: Array<{
    id: string
    name: string
  }>
  user: {
    name: string
    nickname: string | null
    email: string
    phone: string | null
    experienceType: 'newbie' | 'experienced' | 'experienced_outsider'
  }
}
