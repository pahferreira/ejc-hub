import { AppError } from '../../../shared/AppError.ts'
import { runInTransaction } from '../../../core/database/client.ts'
import type { SubscriptionRepository } from '../../../modules/subscription/domain/SubscriptionRepository.ts'
import { SubscriptionStatus } from '../../../modules/subscription/domain/subscription.types.ts'
import type { TeamMembershipRepository } from '../../../modules/team-membership/domain/TeamMembershipRepository.ts'
import type { MemberRequestRepository } from '../../../modules/member-request/domain/MemberRequestRepository.ts'

const CANCELLABLE_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.Received,
  SubscriptionStatus.WaitingList,
  SubscriptionStatus.Completed,
]

export class Subscription {
  #subscriptionRepository: SubscriptionRepository
  #teamMembershipRepository: TeamMembershipRepository
  #memberRequestRepository: MemberRequestRepository

  constructor(
    subscriptionRepository: SubscriptionRepository,
    teamMembershipRepository: TeamMembershipRepository,
    memberRequestRepository: MemberRequestRepository
  ) {
    this.#subscriptionRepository = subscriptionRepository
    this.#teamMembershipRepository = teamMembershipRepository
    this.#memberRequestRepository = memberRequestRepository
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
      subscription.status !== SubscriptionStatus.WaitingList &&
      subscription.status !== SubscriptionStatus.Cancelled
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

  /**
   * Cancels a subscription and clears everything it was holding open.
   *
   * Cancelling *means* the person is not coming, so their team placements and
   * their open member requests go with it. A pending request left behind sits in
   * the admin queue and, if approved, writes a membership for someone who is not
   * attending — the composite subscription FK does not check status, so nothing
   * else would stop it.
   *
   * `confirmSubscription` allows `cancelled -> received`, so this is reversible;
   * the requests are not. A coordinator has to ask again, which is the honest
   * outcome: nobody re-offers a withdrawn person without saying so.
   */
  async cancelSubscription(id: string) {
    const subscription = await this.getSubscription(id)

    if (!CANCELLABLE_STATUSES.includes(subscription.status)) {
      throw new AppError('Subscription cannot be cancelled from its current status')
    }

    return await runInTransaction(async (tx) => {
      await this.#teamMembershipRepository.deleteMembershipsByUserAndEvent(
        subscription.userId,
        subscription.eventId,
        tx
      )

      await this.#memberRequestRepository.cancelOpenRequestsByUserAndEvent(
        subscription.userId,
        subscription.eventId,
        tx
      )

      return await this.#subscriptionRepository.updateSubscriptionStatus(
        id,
        SubscriptionStatus.Cancelled,
        tx
      )
    })
  }
}
