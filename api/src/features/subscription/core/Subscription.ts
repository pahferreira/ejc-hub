import { AppError } from '../../../shared/AppError.ts'
import type { SubscriptionRepository } from '../domain/SubscriptionRepository.ts'

export class Subscription {
  #subscriptionRepository: SubscriptionRepository

  constructor(subscriptionRepository: SubscriptionRepository) {
    this.#subscriptionRepository = subscriptionRepository
  }

  async listSubscriptions() {
    const subscriptions = await this.#subscriptionRepository.listSubscriptions()
    return subscriptions
  }

  async getSubscription(id: string) {
    const subscription = await this.#subscriptionRepository.getSubscriptionById(id)
    if (!subscription) {
      throw new AppError('Subscription not found')
    }

    return subscription
  }
}
