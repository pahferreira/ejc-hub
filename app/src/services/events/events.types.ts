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
