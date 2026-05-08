import type { SyncedUser } from '../../../services/users/users.types'
import type { EventSubscriptionFormInput } from './eventSubscription.schema'

function syncedUserSkillsToFormValues(user: SyncedUser): string[] {
  const out: string[] = []
  if (user.hasActingSkills) out.push('has_acting_skills')
  if (user.hasDancingSkills) out.push('has_dancing_skills')
  if (user.hasSingingSkills) out.push('has_singing_skills')
  if (user.hasCommunicationSkills) out.push('has_communication_skills')
  if (user.hasCookingSkills) out.push('has_cooking_skills')
  if (user.hasManualSkills) out.push('has_manual_skills')
  if (user.hasMusicSkills) out.push('has_music_skills')
  return out
}

export function syncedUserToFormDefaults(user: SyncedUser): EventSubscriptionFormInput {
  return {
    fullName: user.name ?? '',
    nickname: user.nickname ?? '',
    email: user.email ?? '',
    phone: user.phone ?? '',
    emergencyContactName: user.emergencyContactName ?? '',
    emergencyContactPhone: user.emergencyContactPhone ?? '',
    experienceType: user.experienceType ?? 'newbie',
    circle: undefined,
    hasCoordinatorExperience: user.hasCoordinatorExperience ?? false,
    selectedSkills: syncedUserSkillsToFormValues(user),
    selectedTeams: [],
    selectedAvailability: [],
    details: '',
    selectedPreviousExperienceTeams: [],
  }
}
