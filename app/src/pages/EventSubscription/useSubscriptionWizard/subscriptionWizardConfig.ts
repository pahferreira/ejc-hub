import type { EventSubscriptionFormInput } from '../useEventSubscriptionForm/eventSubscription.schema'

export type StepId = 'personal' | 'profile' | 'teams' | 'confirm'

export const STEPS: StepId[] = ['personal', 'profile', 'teams', 'confirm']

export const STEP_FIELDS: Record<StepId, (keyof EventSubscriptionFormInput)[]> = {
  personal: [
    'fullName',
    'nickname',
    'email',
    'phone',
    'emergencyContactName',
    'emergencyContactPhone',
  ],
  profile: [
    'experienceType',
    'circle',
    'hasCoordinatorExperience',
    'selectedPreviousExperienceTeams',
    'selectedSkills',
    'selectedAvailability',
  ],
  teams: ['selectedTeams'],
  confirm: ['details'],
}
