import type { SubscriptionStatus } from '../../../modules/subscription/domain/subscription.types.ts'
import {
  SKILL_KEY_BY_VALUE,
  type SkillValue,
} from '../../../../../common/skills/skill.constants.ts'
import type { ExperienceType, SubscriptionWithDetails } from '../domain/subscription-types.ts'

export type SubscriptionFilters = {
  /** Matched against the subscriber's full name, case-insensitively. */
  name?: string
  /**
   * Resolved team instance ids, not the team keys the route receives. Mapping
   * keys to instances needs the event's team list, which is the caller's to
   * load — keeping it out of here is what makes this function pure.
   */
  teamIds?: string[]
  status?: SubscriptionStatus[]
  /** Snake_case wire values from the shared skill vocabulary. */
  skills?: string[]
  /** `experienceType` only; `hasCoordinatorExperience` is not filterable. */
  experience?: ExperienceType[]
}

/**
 * Narrows an event's subscriptions to what the list asked for.
 *
 * Every filter is optional and they compose with AND, which is what five
 * independent controls above a table mean. The multi-value ones are the
 * exception inside themselves: several selected values match a row carrying
 * **any** of them, because someone ticking "Canta" and "Toca violão", or
 * "Encontrista" and "Encontreiro", is looking for either.
 *
 * Pure and total. A `skills` value outside the shared vocabulary matches
 * nothing, which is the honest answer for a stale bookmark.
 */
export function filterSubscriptions(
  subscriptions: SubscriptionWithDetails[],
  filters: SubscriptionFilters = {}
): SubscriptionWithDetails[] {
  const search = filters.name?.toLowerCase()
  const allowedTeamIds = filters.teamIds?.length ? new Set(filters.teamIds) : undefined
  const selectedSkillKeys = toSkillKeys(filters.skills)

  return subscriptions.filter((subscription) => {
    if (search && !subscription.user.name.toLowerCase().includes(search)) {
      return false
    }

    if (allowedTeamIds && !subscription.teams.some((teamId) => allowedTeamIds.has(teamId))) {
      return false
    }

    if (filters.status?.length && !filters.status.includes(subscription.status)) {
      return false
    }

    if (selectedSkillKeys && !selectedSkillKeys.some((key) => subscription.user[key])) {
      return false
    }

    if (
      filters.experience?.length &&
      !filters.experience.includes(subscription.user.experienceType)
    ) {
      return false
    }

    return true
  })
}

/**
 * Wire values to the user columns they stand for, dropping anything unknown.
 *
 * Returns undefined for an absent or empty selection so the caller can tell
 * "no skill filter" from "a filter nothing can satisfy" — a selection of only
 * unrecognised values is the latter, and must match nobody.
 */
function toSkillKeys(skills?: string[]) {
  if (!skills?.length) {
    return undefined
  }

  return skills.map((skill) => SKILL_KEY_BY_VALUE[skill as SkillValue]).filter(Boolean)
}
