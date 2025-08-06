import { SubscriptionInput, SubscriptionModel } from '../../../core/database/schemas/index.ts'
import type { SubscriptionWithDetails } from './subscription.types.ts'

export interface SubscriptionRepository {
  insertSubscription: (input: SubscriptionInput) => Promise<SubscriptionModel | undefined>
  getSubscription: (id: string) => Promise<SubscriptionModel | undefined>
  listSubscriptions: () => Promise<SubscriptionModel[]>
  listSubscriptionsByEventId: (eventId: string) => Promise<SubscriptionWithDetails[]>
  getSubscriptionByUserAndEvent: (
    userId: string,
    eventId: string
  ) => Promise<SubscriptionModel | undefined>
}
