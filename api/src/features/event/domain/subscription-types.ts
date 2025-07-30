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
    hasCoordinationSkills?: boolean
    hasLogisticsSkills?: boolean
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
