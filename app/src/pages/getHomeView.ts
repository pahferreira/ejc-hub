import type { AssignedTeam, SubscriptionStatus } from '../services/events/events.types'

export type HomeView =
  | { kind: 'subscribe' }
  | { kind: 'subscriptionsClosed' }
  | { kind: 'assignedTeam'; team: AssignedTeam }
  | { kind: 'pendingTeam' }
  | { kind: 'waitingList' }

type HomeViewOptions = {
  subscriptionsOpen?: boolean
  myTeamEnabled?: boolean
}

export function getHomeView(
  subscriptionStatus: SubscriptionStatus | null,
  assignedTeam: AssignedTeam | null,
  options: HomeViewOptions = {}
): HomeView {
  const { subscriptionsOpen = true, myTeamEnabled = false } = options

  if (subscriptionStatus === null) {
    return subscriptionsOpen ? { kind: 'subscribe' } : { kind: 'subscriptionsClosed' }
  }
  if (subscriptionStatus === 'waiting_list') return { kind: 'waitingList' }
  if (subscriptionStatus === 'completed' && assignedTeam && myTeamEnabled) {
    return { kind: 'assignedTeam', team: assignedTeam }
  }
  return { kind: 'pendingTeam' }
}
