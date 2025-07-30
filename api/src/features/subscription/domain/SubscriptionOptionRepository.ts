import type {
  SubscriptionOptionInput,
  SubscriptionOptionModel,
} from '../../../core/database/schemas/index.ts'

export interface SubscriptionOptionRepository {
  insertSubscriptionOptions: (
    input: SubscriptionOptionInput[]
  ) => Promise<SubscriptionOptionModel[]>
  deleteSubscriptionOption: (id: string) => Promise<SubscriptionOptionModel | undefined>
}
