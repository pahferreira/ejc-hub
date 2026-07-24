import type { EventSubscriptionFormInput } from '../useEventSubscriptionForm/eventSubscription.schema'

export type StepId = 'personal' | 'profile' | 'teams' | 'additional' | 'confirm'

export const STEPS: StepId[] = ['personal', 'profile', 'teams', 'additional', 'confirm']

export const STEP_FIELDS: Record<StepId, (keyof EventSubscriptionFormInput)[]> = {
  personal: [
    'fullName',
    'nickname',
    'instagram',
    'dateOfBirth',
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
    'alreadyWorkedHere',
    'alreadyWorkedEvent',
    'alreadyWorkedTeams',
    'groups',
  ],
  teams: ['selectedTeams'],
  additional: ['details', 'workingAnotherEvent'],
  confirm: [],
}
