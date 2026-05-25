export type CreateEventSubscriptionPayload = {
  fullName: string
  nickname: string
  email: string
  phone: string
  emergencyContactName: string
  emergencyContactPhone: string
  experienceType: 'newbie' | 'experienced' | 'experienced_outsider'
  circle?: 'red' | 'green' | 'blue'
  hasCoordinatorExperience: boolean
  selectedSkills: string[]
  selectedTeams: string[]
  details?: string
  availability: string[]
  previousExperienceTeams: string[]
}

export type SubscriptionStatus = 'pending' | 'received' | 'completed' | 'waiting_list'

export type SubscriptionWithDetails = {
  id: string
  status: SubscriptionStatus
  createdAt: string
  teams: Array<{
    id: string
    name: string
  }>
  user: {
    name: string
    email: string
    phone: string | null
    experienceType: 'newbie' | 'experienced' | 'experienced_outsider'
  }
}

export type CurrentEvent = {
  id: string
  name: string
  description: string
  startsAt: string | null
  endsAt: string | null
  location: string | null
  isCurrent: boolean
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
