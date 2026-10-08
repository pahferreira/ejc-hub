import type { ExperienceType } from '../team-building/team-building.types'

/**
 * Where a person stands relative to the coordinator's own team.
 *
 * Mirrors the API's `RequestRowStatus`
 * (`api/src/features/member-request/domain/member-request.types.ts`). `assigned`
 * renders on nothing today — the API excludes anyone already placed (plan
 * decision D2, provisional) — but stays in the union because widening it later
 * would otherwise mean reopening the ordering question at the same time as the
 * eligibility one. Structurally identical to the same-named union
 * `RequestMembersTable` defines locally, on the branch that ships with no
 * service layer at all.
 */
export type RequestRowStatus = 'requested' | 'requestable' | 'assigned'

/** A team the person put on their signup form. Mirrors the API's `TeamPreference`. */
export type TeamPreference = {
  teamInstanceId: string
  name: string
}

/** One person a coordinator may ask for. No `phone`, no `email` — plan decision D3. */
export type RequestableCandidateRow = {
  userId: string
  name: string
  /** The person's nickname, falling back to their first name when unset. */
  nickname: string
  pictureUrl: string | null
  experienceType: ExperienceType
  /** Key of the person's circle (newbies only); null when unset. */
  circleKey: string | null
  /** Skill-derived labels shown as pills (e.g. ["Comunicação"]). */
  areas: string[]
  preferences: TeamPreference[]
  rowStatus: RequestRowStatus
}

export type RequestableCandidateFilters = {
  /** Case- and accent-insensitive substring of the full name or nickname. */
  name?: string
  /** Area labels; a row matching any of them is kept. */
  skills?: string[]
  /** Experience levels; a row matching any of them is kept (plan D15). */
  experience?: ExperienceType[]
  /** `team` keeps only people who listed the caller's team as a preference. */
  preference?: 'team' | 'all'
}

export type RequestPagination = {
  page?: number
  pageSize?: number
}

export type RequestableTeam = {
  id: string
  name: string
  memberCount: number
  maxCapacity: number
  freeSlots: number
}

/**
 * The three cards above the "Solicitar Membros" table.
 *
 * Computed before filtering and paging: the cards describe the team, not the
 * current filter, so searching a name must not drop "Vagas na minha equipe"
 * to 1.
 */
export type RequestableStats = {
  freeSlots: number
  memberCount: number
  maxCapacity: number
  pendingRequests: number
  approvedRequests: number
  /**
   * `freeSlots - pendingRequests`, clamped at 0 by the API. Capacity is never
   * enforced, so the subtraction can go negative; sent rather than derived
   * client-side so the clamp happens once instead of on every card.
   */
  freeSlotsIfAllApproved: number
}

export type RequestableCandidateList = {
  team: RequestableTeam
  stats: RequestableStats
  items: RequestableCandidateRow[]
  /** Candidates matching the filters, across every page. */
  total: number
  page: number
  pageSize: number
}

export type CreateRequestsResult = {
  requestIds: string[]
  requestedCount: number
}

export const memberRequestQueryKeys = {
  /** Root of everything member-requests; invalidated after any write. */
  all: ['member-requests'] as const,
  requestableMembers: ['member-requests', 'candidates'] as const,
  requestableMembersList: (filters: RequestableCandidateFilters, pagination: RequestPagination) =>
    ['member-requests', 'candidates', filters, pagination] as const,
}
