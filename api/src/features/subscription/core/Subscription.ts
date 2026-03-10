import { AppError } from '../../../shared/AppError.ts'
import type { SubscriptionRepository } from '../domain/SubscriptionRepository.ts'
import { SubscriptionStatus } from '../domain/subscription.types.ts'

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

    if (
      subscription.status !== SubscriptionStatus.Pending &&
      subscription.status !== SubscriptionStatus.WaitingList
    ) {
      throw new AppError('Subscription cannot be confirmed from its current status')
    }

    return await this.#subscriptionRepository.updateSubscriptionStatus(
      id,
      SubscriptionStatus.Received
    )
  }

  async waitListSubscription(id: string) {
    const subscription = await this.getSubscription(id)

    if (
      subscription.status !== SubscriptionStatus.Pending &&
      subscription.status !== SubscriptionStatus.Received
    ) {
      throw new AppError('Subscription cannot be moved to waiting list from its current status')
    }

    return await this.#subscriptionRepository.updateSubscriptionStatus(
      id,
      SubscriptionStatus.WaitingList
    )
  }
}
