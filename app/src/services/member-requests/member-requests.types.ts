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

/** A person as a request row renders them. Mirrors the API's `RequestPerson`. */
export type RequestPerson = {
  userId: string
  name: string
  nickname: string
  pictureUrl: string | null
}

/** A named person with no id: who asked, who answered. Mirrors `RequestActor`. */
export type RequestActor = {
  name: string
  nickname?: string
}

export type QueueRequestTeam = {
  id: string
  name: string
  /**
   * `maxCapacity - memberCount`, clamped at 0 by the API.
   *
   * Display only, and legitimately stale: capacity is never enforced on
   * approve (plan D12), so a modal left open shows the count as it was when
   * the list was last fetched.
   */
  freeSlots: number
}

/** A rival request for the same person, as the disputed pill and modals read it. */
export type QueueSiblingRequest = {
  id: string
  team: { id: string; name: string }
  requestedBy: RequestActor
}

/**
 * Every status a request can hold.
 *
 * Mirrors the API's `MemberRequestStatus`. Note that only `approved` and
 * `denied` are an admin's to set — `cancelled` is the coordinator's word and
 * `outdated` is the system's.
 */
export type MemberRequestStatus = 'pending' | 'approved' | 'denied' | 'cancelled' | 'outdated'

/** The two an admin can write. Mirrors the API's `SettableRequestStatus`. */
export type SettableRequestStatus = Extract<MemberRequestStatus, 'approved' | 'denied'>

/** One row of the admin queue. Mirrors the API's `MemberRequestQueueRow`. */
export type MemberRequestQueueRow = {
  id: string
  status: MemberRequestStatus
  user: RequestPerson
  team: QueueRequestTeam
  requestedBy: RequestActor
  message: string | null
  requestedAt: string
  resolvedAt: string | null
  /** Null for `pending`, and for `outdated` — where the system closed it. */
  resolvedBy: RequestActor | null
  resolutionReason: string | null
  /**
   * Other `pending` requests for the same person, in the same event.
   *
   * Cannot be derived client-side: a sibling may sit on another page of a
   * paged list, so a client-side group-by would under-count silently.
   */
  otherPendingRequests: QueueSiblingRequest[]
}

/**
 * The four cards on the admin queue.
 *
 * The unit mismatch is deliberate and spelled out in the UI copy: three of
 * these count *requests* and `disputedMembers` counts distinct *people* (plan
 * D10).
 */
export type MemberRequestQueueStats = {
  pending: number
  /** People with more than one `pending` request. */
  disputedMembers: number
  /**
   * `pending` requests belonging to those people — the other half of the
   * disputed card's caption, "2 membros · 5 solicitações". Unfiltered, so the
   * caption does not change when someone types in the search box.
   */
  disputedRequests: number
  approved: number
  /**
   * `denied` only. Superseded requests are `outdated` and excluded, so this
   * never moves on an approval (plan D9).
   */
  denied: number
}

export type MemberRequestQueueFilters = {
  status?: MemberRequestStatus
  /**
   * Its own boolean, not a sixth `status`: a disputed request's status *is*
   * `pending`, and "disputed" describes the member rather than the request
   * (plan D10).
   */
  disputed?: boolean
  /** Matches the requested person's name or nickname, or the requester's name. */
  name?: string
  /** `team_templates.key` — the stable identifier a team keeps across events. */
  teamKey?: string
}

export type MemberRequestQueueList = {
  /** Over the whole event, before filtering and paging. */
  stats: MemberRequestQueueStats
  items: MemberRequestQueueRow[]
  /** Requests matching the filters, across every page. */
  total: number
  page: number
  pageSize: number
}

export type ResolveRequestResult = {
  requestId: string
  status: SettableRequestStatus
  /**
   * The rival requests this approval closed as `outdated` — always empty for a
   * denial, which answers only its own request.
   */
  supersededRequestIds: string[]
}

/** One row of the coordinator's own list. Mirrors the API's `MyTeamRequestRow`. */
export type MyTeamRequestRow = {
  id: string
  status: MemberRequestStatus
  user: RequestPerson
  /** Who on the team filed it. Always a teammate — see `MyTeamRequestFilters.name`. */
  requestedBy: RequestActor
  message: string | null
  requestedAt: string
  resolvedAt: string | null
  resolutionReason: string | null
}

export type MyTeamRequestFilters = {
  /**
   * Matches the **requested member's** name or nickname only, never the
   * filer's (plan I.4) — on a single team the filer is always a teammate.
   */
  name?: string
  status?: MemberRequestStatus
}

/**
 * The three cards above the coordinator's own list.
 *
 * Computed over the full unfiltered set, before `name`/`status` narrow
 * `items` — the house invariant this page shares with the admin queue (plan
 * I.2).
 */
export type MyTeamRequestStats = {
  pending: number
  approved: number
  denied: number
}

export type MyTeamRequestList = {
  stats: MyTeamRequestStats
  items: MyTeamRequestRow[]
  total: number
}

export const memberRequestQueryKeys = {
  /** Root of everything member-requests; invalidated after any write. */
  all: ['member-requests'] as const,
  requestableMembers: ['member-requests', 'candidates'] as const,
  requestableMembersList: (filters: RequestableCandidateFilters, pagination: RequestPagination) =>
    ['member-requests', 'candidates', filters, pagination] as const,
  queue: ['member-requests', 'queue'] as const,
  queueList: (filters: MemberRequestQueueFilters, pagination: RequestPagination) =>
    ['member-requests', 'queue', filters, pagination] as const,
  myTeam: ['member-requests', 'my-team'] as const,
  myTeamList: (filters: MyTeamRequestFilters) => ['member-requests', 'my-team', filters] as const,
}
