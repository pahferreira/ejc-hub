export type CreateEventSubscriptionPayload = {
  fullName: string
  nickname: string
  instagram?: string
  dateOfBirth?: string
  email: string
  phone: string
  emergencyContactName: string
  emergencyContactPhone: string
  gender: 'male' | 'female'
  experienceType: 'newbie' | 'experienced' | 'experienced_outsider'
  circle?: string
  hasCoordinatorExperience: boolean
  selectedSkills: string[]
  selectedTeams: string[]
  details?: string
  workingAnotherEvent?: boolean
  availability: string[]
  previousExperienceTeams: string[]
  alreadyWorkedHere?: boolean
  alreadyWorkedEvent?: string
  alreadyWorkedTeams?: string
  groups?: string
}

import type {
  SubscriptionStatus,
  SubscriptionWithDetails,
} from '../subscriptions/subscriptions.types'
import type { TeamMembershipType } from '../teams/teams.types'
import type { ExperienceTypeValue } from '../../../../common/skills'

export type { SubscriptionStatus, SubscriptionWithDetails }

export type EventSubscriptionMode = 'open' | 'waiting_list' | 'closed'

export type CurrentEvent = {
  id: string
  name: string
  description: string
  startsAt: string | null
  endsAt: string | null
  location: string | null
  isCurrent: boolean
  subscriptionMode: EventSubscriptionMode
  feeAmountCents: number
  feeCurrency: string
}

export type AssignedTeam = {
  id: string
  name: string
  description: string | null
  coordinators: Array<{
    id: string
    name: string
    phone: string | null
  }>
}

export type TeamPreference = {
  key: string
  name: string
}

/**
 * Whether the signed-in member has settled their own event fee.
 *
 * `paid` folds together the `paid` and `exempt` payment statuses, exactly as the
 * treasurer's list does: a comped member owes nothing, so they are settled.
 * Everything else — including having no payment record at all — is `pending`.
 */
export type MyEventFeeStatus = 'paid' | 'pending'

export type CurrentEventSubscriptionStatus = {
  eventName: string
  subscriptionStatus: SubscriptionStatus | null
  assignedTeam: AssignedTeam | null
  preferences: TeamPreference[]
  /**
   * How the signed-in member belongs to their team, or null when they have no
   * team in the event.
   *
   * Carried on this endpoint rather than on the team detail one because the
   * sidebar needs it on every route: this response is already fetched app-wide
   * and is a fraction of the size of a full roster.
   *
   * Drives which coordinator-only screens are offered. The API enforces the same
   * rule again on every write, so a client that ignores this is denied, not let
   * through.
   */
  myMembershipType: TeamMembershipType | null
  /** Null for someone who has not subscribed — no place in the event, no fee. */
  eventFeeStatus: MyEventFeeStatus | null
}

export type SubscriptionListFilters = {
  status?: SubscriptionStatus[]
  teamKeys?: string[]
  name?: string
  /** Snake_case wire values from the shared skill vocabulary, not labels. */
  skills?: string[]
  /** `experienceType` only — the coordinator-experience flag is not filterable. */
  experience?: ExperienceTypeValue[]
}

export type SubscriptionListPagination = {
  page?: number
  pageSize?: number
}

export type SubscriptionListResponse = {
  items: SubscriptionWithDetails[]
  total: number
  page: number
  pageSize: number
}

export type SubscriptionStatsResponse = Record<SubscriptionStatus, number>

export const eventsQueryKeys = {
  currentEvent: ['events', 'current'] as const,
}

export const subscriptionsQueryKeys = {
  currentEvent: [...eventsQueryKeys.currentEvent, 'subscriptions'] as const,
  currentEventListSubscriptions: (
    filters: SubscriptionListFilters,
    pagination: SubscriptionListPagination
  ) => [...eventsQueryKeys.currentEvent, 'subscriptions', 'list', filters, pagination] as const,
  currentEventStats: [...eventsQueryKeys.currentEvent, 'subscriptions', 'stats'] as const,
  currentEventForMe: [...eventsQueryKeys.currentEvent, 'subscription', 'me'] as const,
}
