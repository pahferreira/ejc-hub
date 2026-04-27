import { SubscriptionInput, SubscriptionModel } from '../../../core/database/schemas/index.ts'
import type { SubscriptionStatus } from './subscription.types.ts'

export interface SubscriptionRepository {
  insertSubscription: (input: SubscriptionInput) => Promise<SubscriptionModel | undefined>
  getSubscription: (id: string) => Promise<SubscriptionModel | undefined>
  listSubscriptions: () => Promise<SubscriptionModel[]>
  listSubscriptionsByEventId: (eventId: string) => Promise<
    {
      id: string
      status: SubscriptionStatus
      createdAt: Date
      teams: string[]
      user: { name: string; email: string; phone: string | null }
    }[]
  >
  getSubscriptionByUserAndEvent: (
    userId: string,
    eventId: string
  ) => Promise<SubscriptionModel | undefined>
  updateSubscriptionStatus: (
    id: string,
    status: SubscriptionStatus
  ) => Promise<SubscriptionModel | undefined>
}
