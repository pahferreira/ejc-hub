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
    id: string
    emergencyContactName: string
    emergencyContactPhone: string
    isNewbie: boolean
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
  hasCoordinatorExperience: boolean
  options: string[]
  availability: SubscriptionAvailability[]
}
