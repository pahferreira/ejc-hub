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
    const subscription = await this.#subscriptionRepository.getSubscription(id)

    if (!subscription) {
      throw new AppError('Subscription not found')
    }

    return subscription
  }

  async confirmSubscription(id: string) {
    const subscription = await this.getSubscription(id)

    if (subscription.status !== 'pending' && subscription.status !== 'waiting_list') {
      throw new AppError('Subscription cannot be confirmed from its current status')
    }

    const updated = await this.#subscriptionRepository.updateSubscriptionStatus(id, 'received')
    return updated
  }

  async waitListSubscription(id: string) {
    const subscription = await this.getSubscription(id)

    if (subscription.status !== 'pending' && subscription.status !== 'received') {
      throw new AppError('Subscription cannot be moved to waiting list from its current status')
    }

    const updated = await this.#subscriptionRepository.updateSubscriptionStatus(id, 'waiting_list')
    return updated
  }
}
