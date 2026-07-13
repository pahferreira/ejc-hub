import type { DefaultValues } from 'react-hook-form'
import type { SyncedUser } from '../../../services/users/users.types'
import type { EventSubscriptionFormInput } from './eventSubscription.schema'
import { skills } from '../profileOptions'

function syncedUserSkillsToFormValues(user: SyncedUser): string[] {
  return skills.filter(({ key }) => user[key]).map(({ value }) => value)
}

// DefaultValues (deep-partial) rather than the full input type: gender is a
// required form field the synced user doesn't carry — the subscriber picks it.
export function syncedUserToFormDefaults(
  user: SyncedUser
): DefaultValues<EventSubscriptionFormInput> {
  return {
    // Auth0 database signups store the email as the name placeholder; leave
    // the field blank in that case so the subscriber types their real name.
    fullName: user.name && user.name !== user.email ? user.name : '',
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
