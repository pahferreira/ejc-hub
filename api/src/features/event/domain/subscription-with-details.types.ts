import type { SubscriptionStatus } from '../../../modules/subscription/domain/subscription.types.ts'

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
