import type {
  AssignedTeam,
  EventSubscriptionMode,
  SubscriptionStatus,
} from '../services/events/events.types'

export type HomeView =
  | { kind: 'subscribe'; waitingList: boolean }
  | { kind: 'subscriptionsClosed' }
  | { kind: 'assignedTeam'; team: AssignedTeam }
  | { kind: 'pendingTeam' }
  | { kind: 'waitingList' }

type HomeViewOptions = {
  subscriptionMode?: EventSubscriptionMode
}

export function getHomeView(
  subscriptionStatus: SubscriptionStatus | null,
  assignedTeam: AssignedTeam | null,
  options: HomeViewOptions = {}
): HomeView {
  const { subscriptionMode = 'open' } = options

  if (subscriptionStatus === null) {
    if (subscriptionMode === 'closed') return { kind: 'subscriptionsClosed' }

    // Waiting-list mode still shows the form — signups are open, they just land
    // on the waiting list. The flag is what lets the card say so up front.
    return { kind: 'subscribe', waitingList: subscriptionMode === 'waiting_list' }
  }
  if (subscriptionStatus === 'waiting_list') return { kind: 'waitingList' }
  if (subscriptionStatus === 'completed' && assignedTeam) {
    return { kind: 'assignedTeam', team: assignedTeam }
  }
  return { kind: 'pendingTeam' }
}
