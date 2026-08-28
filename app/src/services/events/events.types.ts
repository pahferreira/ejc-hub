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

export type CurrentEventSubscriptionStatus = {
  eventName: string
  subscriptionStatus: SubscriptionStatus | null
  assignedTeam: AssignedTeam | null
  preferences: TeamPreference[]
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
