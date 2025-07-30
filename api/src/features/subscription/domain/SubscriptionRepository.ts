import { SubscriptionInput, SubscriptionModel } from '../../../core/database/schemas/index.ts'

export interface SubscriptionRepository {
  insertSubscription: (input: SubscriptionInput) => Promise<SubscriptionModel | undefined>
  getSubscriptionById: (id: string) => Promise<SubscriptionModel | undefined>
  listSubscriptions: () => Promise<SubscriptionModel[]>
  getSubscriptionByUserAndEvent: (
    userId: string,
    eventId: string
  ) => Promise<SubscriptionModel | undefined>
}
