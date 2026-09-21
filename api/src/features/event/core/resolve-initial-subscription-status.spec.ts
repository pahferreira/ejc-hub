import { describe, it, expect } from 'vitest'
import { resolveInitialSubscriptionStatus } from './resolve-initial-subscription-status.ts'
import { EventSubscriptionMode } from '../../../modules/event/domain/event-subscription-mode.ts'
import { SubscriptionStatus } from '../../../modules/subscription/domain/subscription.types.ts'

describe('resolveInitialSubscriptionStatus', () => {
  it('starts a subscription as pending while the event takes signups normally', () => {
    expect(resolveInitialSubscriptionStatus(EventSubscriptionMode.Open)).toBe(
      SubscriptionStatus.Pending
    )
  })

  it('lands a subscription on the waiting list when the event is in waiting-list mode', () => {
    expect(resolveInitialSubscriptionStatus(EventSubscriptionMode.WaitingList)).toBe(
      SubscriptionStatus.WaitingList
    )
  })

  it('falls back to pending for a closed event, which the caller rejects before reaching here', () => {
    expect(resolveInitialSubscriptionStatus(EventSubscriptionMode.Closed)).toBe(
      SubscriptionStatus.Pending
    )
  })
})
