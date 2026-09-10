export type CreateEventSubscriptionPayload = {
  fullName: string
  nickname: string
  instagram?: string
  dateOfBirth?: string
  email: string
  phone: string
  emergencyContactName: string
  emergencyContactPhone: string
  gender: 'male' | 'female'
  experienceType: 'newbie' | 'experienced' | 'experienced_outsider'
  circle?: string
  hasCoordinatorExperience: boolean
  selectedSkills: string[]
  selectedTeams: string[]
  details?: string
  workingAnotherEvent?: boolean
  availability: string[]
  previousExperienceTeams: string[]
  alreadyWorkedHere?: boolean
  alreadyWorkedEvent?: string
  alreadyWorkedTeams?: string
  groups?: string
}

import type {
  SubscriptionStatus,
  SubscriptionWithDetails,
} from '../subscriptions/subscriptions.types'

export type { SubscriptionStatus, SubscriptionWithDetails }

export type CurrentEvent = {
  id: string
  name: string
  description: string
  startsAt: string | null
  endsAt: string | null
  location: string | null
  isCurrent: boolean
  subscriptionsOpen: boolean
  feeAmountCents: number
  feeCurrency: string
}

export type AssignedTeam = {
  id: string
  name: string
  description: string | null
  coordinators: Array<{
    id: string
    name: string
    phone: string | null
  }>
}

export type TeamPreference = {
  key: string
  name: string
}

/**
 * Whether the signed-in member has settled their own event fee.
 *
 * `paid` folds together the `paid` and `exempt` payment statuses, exactly as the
 * treasurer's list does: a comped member owes nothing, so they are settled.
 * Everything else — including having no payment record at all — is `pending`.
 */
export type MyEventFeeStatus = 'paid' | 'pending'

export type CurrentEventSubscriptionStatus = {
  eventName: string
  subscriptionStatus: SubscriptionStatus | null
  assignedTeam: AssignedTeam | null
  preferences: TeamPreference[]
  /** Null for someone who has not subscribed — no place in the event, no fee. */
  eventFeeStatus: MyEventFeeStatus | null
}

export type SubscriptionListFilters = {
  status?: SubscriptionStatus[]
  teamKeys?: string[]
  name?: string
}

export type SubscriptionListPagination = {
  page?: number
  pageSize?: number
}

export type SubscriptionListResponse = {
  items: SubscriptionWithDetails[]
  total: number
  page: number
  pageSize: number
}

export type SubscriptionStatsResponse = Record<SubscriptionStatus, number>

export const eventsQueryKeys = {
  currentEvent: ['events', 'current'] as const,
}

export const subscriptionsQueryKeys = {
  currentEvent: [...eventsQueryKeys.currentEvent, 'subscriptions'] as const,
  currentEventListSubscriptions: (
    filters: SubscriptionListFilters,
    pagination: SubscriptionListPagination
  ) => [...eventsQueryKeys.currentEvent, 'subscriptions', 'list', filters, pagination] as const,
  currentEventStats: [...eventsQueryKeys.currentEvent, 'subscriptions', 'stats'] as const,
  currentEventForMe: [...eventsQueryKeys.currentEvent, 'subscription', 'me'] as const,
}
