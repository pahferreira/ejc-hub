import type { DefaultValues } from 'react-hook-form'
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
  if (user.hasGuitarSkills) out.push('has_guitar_skills')
  if (user.hasPercussionSkills) out.push('has_percussion_skills')
  return out
}

// DefaultValues (deep-partial) rather than the full input type: gender is a
// required form field the synced user doesn't carry — the subscriber picks it.
export function syncedUserToFormDefaults(
  user: SyncedUser
): DefaultValues<EventSubscriptionFormInput> {
  return {
    fullName: user.name ?? '',
    nickname: user.nickname ?? '',
    instagram: user.instagram ?? '',
    // Native date inputs expect yyyy-mm-dd; the API sends an ISO timestamp.
    dateOfBirth: user.dateOfBirth?.slice(0, 10) ?? '',
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
    workingAnotherEvent: false,
    selectedPreviousExperienceTeams: [],
  }
}
