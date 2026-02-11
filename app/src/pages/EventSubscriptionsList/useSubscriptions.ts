import { useState } from 'react'
import { mockSubscriptions } from './subscriptions.mock'
import type { SubscriptionWithDetails, SubscriptionStats } from './subscription.types'

type UseSubscriptionsReturn = {
  subscriptions: SubscriptionWithDetails[]
  stats: SubscriptionStats
  isLoading: boolean
  error: Error | null
}

function calculateStats(subscriptions: SubscriptionWithDetails[]): SubscriptionStats {
  return {
    total: subscriptions.length,
    pending: subscriptions.filter((s) => s.status === 'pending').length,
    approved: subscriptions.filter((s) => s.status === 'received').length,
    completed: subscriptions.filter((s) => s.status === 'completed').length,
    waitingList: subscriptions.filter((s) => s.status === 'waiting_list').length,
  }
}

export function useSubscriptions(): UseSubscriptionsReturn {
  // TODO: Replace with actual API calls when backend is ready
  const [subscriptions] = useState<SubscriptionWithDetails[]>(mockSubscriptions)
  const [isLoading] = useState(false)
  const [error] = useState<Error | null>(null)

  const stats = calculateStats(subscriptions)

  return { subscriptions, stats, isLoading, error }
}
