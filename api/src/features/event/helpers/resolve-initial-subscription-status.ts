import { EventSubscriptionMode } from '../../../modules/event/domain/event-subscription-mode.ts'
import { SubscriptionStatus } from '../../../modules/subscription/domain/subscription.types.ts'

export function resolveInitialSubscriptionStatus(mode: EventSubscriptionMode): SubscriptionStatus {
  if (mode === EventSubscriptionMode.WaitingList) {
    return SubscriptionStatus.WaitingList
  }

  return SubscriptionStatus.Pending
}
