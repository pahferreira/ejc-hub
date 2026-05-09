import type {
  SubscriptionOptionInput,
  SubscriptionOptionModel,
} from '../../../core/database/schemas/index.ts'

export type SubscriptionPreference = {
  key: string
  name: string
}

export interface SubscriptionOptionRepository {
  insertSubscriptionOptions: (
    input: SubscriptionOptionInput[]
  ) => Promise<SubscriptionOptionModel[]>
  deleteSubscriptionOption: (id: string) => Promise<SubscriptionOptionModel | undefined>
  listTeamOptionsBySubscription: (subscriptionId: string) => Promise<SubscriptionPreference[]>
}
