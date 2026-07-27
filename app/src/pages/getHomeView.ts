import type { AssignedTeam, SubscriptionStatus } from '../services/events/events.types'

export type HomeView =
  | { kind: 'subscribe' }
  | { kind: 'subscriptionsClosed' }
  | { kind: 'assignedTeam'; team: AssignedTeam }
  | { kind: 'pendingTeam' }
  | { kind: 'waitingList' }

export function getHomeView(
  subscriptionStatus: SubscriptionStatus | null,
  assignedTeam: AssignedTeam | null,
  subscriptionsOpen: boolean = true
): HomeView {
  if (subscriptionStatus === null) {
    return subscriptionsOpen ? { kind: 'subscribe' } : { kind: 'subscriptionsClosed' }
  }
  if (subscriptionStatus === 'waiting_list') return { kind: 'waitingList' }
  if (subscriptionStatus === 'completed' && assignedTeam) {
    return { kind: 'assignedTeam', team: assignedTeam }
  }
  return { kind: 'pendingTeam' }
}
