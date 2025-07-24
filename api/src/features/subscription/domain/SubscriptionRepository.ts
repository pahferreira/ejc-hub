import { SubscriptionInput, SubscriptionModel } from '../../../core/database/schemas/index.ts'

export interface SubscriptionRepository {
  insertSubscription: (input: SubscriptionInput) => Promise<SubscriptionModel>
  deleteSubscription: (id: string) => Promise<SubscriptionModel | undefined>
  updateSubscription: (
    id: string,
    input: Partial<SubscriptionInput>
  ) => Promise<SubscriptionModel | undefined>
  getSubscriptionById: (id: string) => Promise<SubscriptionModel | undefined>
  listSubscriptions: () => Promise<SubscriptionModel[]>
}
