import { describe, it, expect, vi, beforeEach } from 'vitest'

// runInTransaction is mocked to run the callback with a throwaway tx handle so
// the core logic can be unit-tested without a database.
vi.mock('../../../core/database/client.ts', () => ({
  runInTransaction: (fn: (tx: unknown) => Promise<unknown>) => fn({}),
}))

import { Subscription } from './Subscription.ts'
import type { SubscriptionRepository } from '../../../modules/subscription/domain/SubscriptionRepository.ts'
import type { TeamMembershipRepository } from '../../../modules/team-membership/domain/TeamMembershipRepository.ts'
import { SubscriptionStatus } from '../../../modules/subscription/domain/subscription.types.ts'

type SubModel = Awaited<ReturnType<SubscriptionRepository['getSubscription']>>

function buildSubscription(overrides: Partial<NonNullable<SubModel>> = {}): NonNullable<SubModel> {
  return {
    id: 'sub-1',
    userId: 'user-1',
    eventId: 'event-1',
    status: SubscriptionStatus.Received,
    availability: [],
    details: null,
    workingAnotherEvent: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    previousExperienceTeams: [],
    alreadyWorkedHere: null,
    alreadyWorkedEvent: null,
    alreadyWorkedTeams: null,
    groups: null,
    ...overrides,
  } as NonNullable<SubModel>
}

function makeRepos(subscription: NonNullable<SubModel> | undefined) {
  const subscriptionRepository = {
    getSubscription: vi.fn().mockResolvedValue(subscription),
    updateSubscriptionStatus: vi
      .fn()
      .mockImplementation((id: string, status: string) =>
        Promise.resolve({ ...(subscription as NonNullable<SubModel>), id, status })
      ),
  } as unknown as SubscriptionRepository

  const teamMembershipRepository = {
    deleteMembershipsByUserAndEvent: vi.fn().mockResolvedValue(undefined),
  } as unknown as TeamMembershipRepository

  return { subscriptionRepository, teamMembershipRepository }
}

describe('Subscription.cancelSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each([
    SubscriptionStatus.Received,
    SubscriptionStatus.WaitingList,
    SubscriptionStatus.Completed,
  ])('cancels from %s', async (status) => {
    const subscription = buildSubscription({ status })
    const repos = makeRepos(subscription)
    const subscriptionApp = new Subscription(
      repos.subscriptionRepository,
      repos.teamMembershipRepository
    )

    await subscriptionApp.cancelSubscription('sub-1')

    expect(repos.subscriptionRepository.updateSubscriptionStatus).toHaveBeenCalledWith(
      'sub-1',
      SubscriptionStatus.Cancelled,
      {}
    )
  })

  it.each([SubscriptionStatus.Pending, SubscriptionStatus.Cancelled])(
    'rejects cancelling from %s',
    async (status) => {
      const subscription = buildSubscription({ status })
      const repos = makeRepos(subscription)
      const subscriptionApp = new Subscription(
        repos.subscriptionRepository,
        repos.teamMembershipRepository
      )

      await expect(subscriptionApp.cancelSubscription('sub-1')).rejects.toThrow(
        'Subscription cannot be cancelled from its current status'
      )
    }
  )

  it('throws when the subscription does not exist', async () => {
    const repos = makeRepos(undefined)
    const subscriptionApp = new Subscription(
      repos.subscriptionRepository,
      repos.teamMembershipRepository
    )

    await expect(subscriptionApp.cancelSubscription('missing')).rejects.toThrow(
      'Subscription not found'
    )
  })

  it("revokes memberships using the subscription's own userId and eventId", async () => {
    const subscription = buildSubscription({
      userId: 'the-user',
      eventId: 'the-event',
      status: SubscriptionStatus.Completed,
    })
    const repos = makeRepos(subscription)
    const subscriptionApp = new Subscription(
      repos.subscriptionRepository,
      repos.teamMembershipRepository
    )

    await subscriptionApp.cancelSubscription('sub-1')

    expect(repos.teamMembershipRepository.deleteMembershipsByUserAndEvent).toHaveBeenCalledWith(
      'the-user',
      'the-event',
      {}
    )
  })

  it.each([SubscriptionStatus.Received, SubscriptionStatus.WaitingList])(
    'revokes memberships even from %s (a no-op delete, but unconditional)',
    async (status) => {
      const subscription = buildSubscription({ status })
      const repos = makeRepos(subscription)
      const subscriptionApp = new Subscription(
        repos.subscriptionRepository,
        repos.teamMembershipRepository
      )

      await subscriptionApp.cancelSubscription('sub-1')

      expect(repos.teamMembershipRepository.deleteMembershipsByUserAndEvent).toHaveBeenCalled()
    }
  )

  it('revokes memberships and updates status with the same transaction handle', async () => {
    const subscription = buildSubscription({ status: SubscriptionStatus.Completed })
    const repos = makeRepos(subscription)
    const subscriptionApp = new Subscription(
      repos.subscriptionRepository,
      repos.teamMembershipRepository
    )

    await subscriptionApp.cancelSubscription('sub-1')

    const revokeTx = vi.mocked(repos.teamMembershipRepository.deleteMembershipsByUserAndEvent).mock
      .calls[0][2]
    const updateTx = vi.mocked(repos.subscriptionRepository.updateSubscriptionStatus).mock
      .calls[0][2]

    expect(revokeTx).toBe(updateTx)
  })
})

describe('Subscription.confirmSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each([
    SubscriptionStatus.Pending,
    SubscriptionStatus.WaitingList,
    SubscriptionStatus.Cancelled,
  ])('confirms from %s', async (status) => {
    const subscription = buildSubscription({ status })
    const repos = makeRepos(subscription)
    const subscriptionApp = new Subscription(
      repos.subscriptionRepository,
      repos.teamMembershipRepository
    )

    await subscriptionApp.confirmSubscription('sub-1')

    expect(repos.subscriptionRepository.updateSubscriptionStatus).toHaveBeenCalledWith(
      'sub-1',
      SubscriptionStatus.Received
    )
  })

  it('does not call the membership repository when un-cancelling', async () => {
    const subscription = buildSubscription({ status: SubscriptionStatus.Cancelled })
    const repos = makeRepos(subscription)
    const subscriptionApp = new Subscription(
      repos.subscriptionRepository,
      repos.teamMembershipRepository
    )

    await subscriptionApp.confirmSubscription('sub-1')

    expect(repos.teamMembershipRepository.deleteMembershipsByUserAndEvent).not.toHaveBeenCalled()
  })

  it('rejects confirming from a status other than pending, waiting_list or cancelled', async () => {
    const subscription = buildSubscription({ status: SubscriptionStatus.Completed })
    const repos = makeRepos(subscription)
    const subscriptionApp = new Subscription(
      repos.subscriptionRepository,
      repos.teamMembershipRepository
    )

    await expect(subscriptionApp.confirmSubscription('sub-1')).rejects.toThrow(
      'Subscription cannot be confirmed from its current status'
    )
  })
})

describe('Subscription.waitListSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each([SubscriptionStatus.Pending, SubscriptionStatus.Received])(
    'moves to waiting list from %s',
    async (status) => {
      const subscription = buildSubscription({ status })
      const repos = makeRepos(subscription)
      const subscriptionApp = new Subscription(
        repos.subscriptionRepository,
        repos.teamMembershipRepository
      )

      await subscriptionApp.waitListSubscription('sub-1')

      expect(repos.subscriptionRepository.updateSubscriptionStatus).toHaveBeenCalledWith(
        'sub-1',
        SubscriptionStatus.WaitingList
      )
    }
  )

  it('rejects moving to waiting list from a status other than pending or received', async () => {
    const subscription = buildSubscription({ status: SubscriptionStatus.Completed })
    const repos = makeRepos(subscription)
    const subscriptionApp = new Subscription(
      repos.subscriptionRepository,
      repos.teamMembershipRepository
    )

    await expect(subscriptionApp.waitListSubscription('sub-1')).rejects.toThrow(
      'Subscription cannot be moved to waiting list from its current status'
    )
  })
})
