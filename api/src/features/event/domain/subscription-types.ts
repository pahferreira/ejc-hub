import { SubscriptionStatus } from '../../../modules/subscription/domain/subscription.types.ts'

export type ExperienceType = 'newbie' | 'experienced' | 'experienced_outsider'

export type Gender = 'male' | 'female'

export type SubscriberCircle = {
  key: string
  label: string
  color: string
}

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
    hasGuitarSkills?: boolean
    hasPercussionSkills?: boolean
    hasMidiaSkills?: boolean
  }
  options: string[]
  availability: SubscriptionAvailability[]
}

export type CurrentEventSubscriptionPayload = {
  fullName: string
  nickname: string
  instagram?: string
  dateOfBirth?: string
  email: string
  phone: string
  emergencyContactName: string
  emergencyContactPhone: string
  gender: Gender
  experienceType: ExperienceType
  circle?: string
  hasCoordinatorExperience?: boolean
  selectedSkills: string[]
  selectedTeams: string[]
  details?: string
  workingAnotherEvent?: boolean
  previousExperienceTeams: string[]
  availability: SubscriptionAvailability[]
  alreadyWorkedHere?: boolean
  alreadyWorkedEvent?: string
  alreadyWorkedTeams?: string
  groups?: string
}

export type SubscriptionWithDetails = {
  id: string
  userId: string
  status: SubscriptionStatus
  createdAt: Date
  availability: string[]
  details: string | null
  teams: string[]
  user: {
    name: string
    nickname: string | null
    email: string
    phone: string | null
    pictureUrl: string | null
    experienceType: ExperienceType
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
