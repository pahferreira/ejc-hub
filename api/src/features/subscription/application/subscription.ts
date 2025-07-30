import { Subscription } from '../core/Subscription.ts'
import { subscriptionRepository } from '../repository/DrizzleSubscriptionRepository.ts'

export const subscriptionApp = new Subscription(subscriptionRepository)
