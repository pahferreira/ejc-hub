type SubscriptionAvailability =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export type SubscriptionPayload = {
  user: {
    emergencyContactName: string
    emergencyContactPhone: string
    isNewbie?: boolean
    hasCoordinatorExperience?: boolean
  }
  skills: {
    hasActingSkills?: boolean
    hasCommunicationSkills?: boolean
    hasManualSkills?: boolean
    hasCookingSkills?: boolean
    hasMusicSkills?: boolean
    hasDancingSkills?: boolean
    hasSingingSkills?: boolean
  }
  options: string[]
  availability: SubscriptionAvailability[]
}

export type CurrentEventSubscriptionPayload = {
  fullName: string
  nickname: string
  email: string
  phone: string
  emergencyContactName: string
  emergencyContactPhone: string
  isNewbie?: boolean
  hasCoordinatorExperience?: boolean
  selectedSkills: string[]
  selectedTeams: string[]
  availability: SubscriptionAvailability[]
}
