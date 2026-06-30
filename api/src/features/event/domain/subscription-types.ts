import { SubscriptionStatus } from '../../../modules/subscription/domain/subscription.types.ts'

export type ExperienceType = 'newbie' | 'experienced' | 'experienced_outsider'

export type Gender = 'male' | 'female'

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
    gender: Gender
    experienceType: ExperienceType
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
  gender: Gender
  experienceType: ExperienceType
  hasCoordinatorExperience?: boolean
  selectedSkills: string[]
  selectedTeams: string[]
  availability: SubscriptionAvailability[]
}

export type SubscriptionWithDetails = {
  id: string
  userId: string
  status: SubscriptionStatus
  createdAt: Date
  teams: string[]
  user: {
    name: string
    nickname: string | null
    email: string
    phone: string | null
    experienceType: ExperienceType
    hasActingSkills: boolean
    hasCommunicationSkills: boolean
    hasCookingSkills: boolean
    hasDancingSkills: boolean
    hasManualSkills: boolean
    hasMusicSkills: boolean
    hasSingingSkills: boolean
  }
}
