export type CreateEventSubscriptionPayload = {
  fullName: string
  nickname: string
  email: string
  phone: string
  emergencyContactName: string
  emergencyContactPhone: string
  isNewbie: boolean
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
  }
}

export const eventsQueryKeys = {
  currentEvent: ['events', 'current'] as const,
}

export const subscriptionsQueryKeys = {
  currentEvent: [...eventsQueryKeys.currentEvent, 'subscriptions'] as const,
}
