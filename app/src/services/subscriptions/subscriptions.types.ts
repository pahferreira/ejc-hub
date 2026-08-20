export type SubscriptionStatus = 'pending' | 'received' | 'completed' | 'waiting_list' | 'cancelled'

export type SubscriberCircle = {
  key: string
  label: string
  color: string
}

export type SubscriptionWithDetails = {
  id: string
  status: SubscriptionStatus
  createdAt: string
  details: string | null
  teams: Array<{
    id: string
    name: string
  }>
  user: {
    name: string
    nickname: string | null
    email: string
    phone: string | null
    instagram: string | null
    experienceType: 'newbie' | 'experienced' | 'experienced_outsider'
    circle: SubscriberCircle | null
    hasCoordinatorExperience: boolean
    hasActingSkills: boolean
    hasCommunicationSkills: boolean
    hasCookingSkills: boolean
    hasDancingSkills: boolean
    hasManualSkills: boolean
    hasMusicSkills: boolean
    hasSingingSkills: boolean
    hasGuitarSkills: boolean
    hasPercussionSkills: boolean
    hasMidiaSkills: boolean
  }
}
