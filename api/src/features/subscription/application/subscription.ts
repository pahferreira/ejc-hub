import { Subscription } from '../core/Subscription.ts'
import { subscriptionRepository } from '../../../modules/subscription/repository/DrizzleSubscriptionRepository.ts'

export const subscriptionApp = new Subscription(subscriptionRepository)
