import type { ExperienceType } from '../../team-building/domain/board.types.ts'
import type {
  MemberRequestStatus,
  SettableRequestStatus,
} from '../../../modules/member-request/domain/member-request-status.ts'

/**
 * Where a person stands relative to the coordinator's own team.
 *
 * Three values, one of which cannot occur yet: `#listEligibleSubscribers`
 * excludes anyone holding a membership, so nothing renders as `assigned` today
 * (plan decision D2, provisional). The tier stays in the union and in the sort
 * because widening it later would otherwise mean reopening the ordering
 * question at the same time as the eligibility one.
 */
export type RequestRowStatus = 'requested' | 'requestable' | 'assigned'

/**
 * A team the person put on their signup form.
 *
 * A pair rather than the two parallel arrays `Candidate` carries
 * (`preferenceTeamIds` + `preferences`): those must be zipped by index, and the
 * name array silently drops ids that no longer name a team of this event, so
 * the indexes do not line up in exactly the case that breaks quietly.
 */
export type TeamPreference = {
  teamInstanceId: string
  name: string
}

/** One person a coordinator may ask for. No phone, no email — see plan D3. */
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
  /** Area labels; a row matching **any** of them is kept. */
  skills?: string[]
  /** Experience levels; a row matching **any** of them is kept (plan D15). */
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
   * `freeSlots - pendingRequests`, clamped at 0.
   *
   * Sent rather than derived client-side: capacity is never enforced, so the
   * subtraction can go negative, and the API clamps it once instead of every
   * card doing it.
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

export type CancelRequestResult = {
  requestId: string
  status: Extract<MemberRequestStatus, 'cancelled'>
}

export type ResolveRequestResult = {
  requestId: string
  status: SettableRequestStatus
  /**
   * The rival requests this approval closed as `outdated`.
   *
   * Always empty for a denial, which answers only its own request. The queue
   * needs the count for its toast and to know that rows it never named have
   * changed.
   */
  supersededRequestIds: string[]
}

/** A person as a request list renders them. */
export type RequestPerson = {
  userId: string
  name: string
  nickname: string
  pictureUrl: string | null
}

/** A named person with no id: who asked, who answered. */
export type RequestActor = {
  name: string
  nickname: string
}

/** One row of the coordinator's own queue (endpoint 3). */
export type MyTeamRequest = {
  id: string
  status: MemberRequestStatus
  user: RequestPerson
  message: string | null
  requestedAt: Date
  resolvedAt: Date | null
  resolutionReason: string | null
}

export type QueueRequestTeam = {
  id: string
  name: string
  /** `maxCapacity - memberCount`, clamped at 0. Display only — never a guard. */
  freeSlots: number
}

/** A rival request for the same person, as the disputed pill and modals read it. */
export type QueueSiblingRequest = {
  id: string
  team: { id: string; name: string }
  requestedBy: RequestActor
}

export type MemberRequestQueueRow = {
  id: string
  status: MemberRequestStatus
  user: RequestPerson
  team: QueueRequestTeam
  requestedBy: RequestActor
  message: string | null
  requestedAt: Date
  resolvedAt: Date | null
  /** Null for `pending`, and for `outdated` — where the system closed it. */
  resolvedBy: RequestActor | null
  resolutionReason: string | null
  /**
   * Other `pending` requests for the same person, in the same event.
   *
   * Cannot be derived client-side: a sibling may sit on another page of a paged
   * list, so a client group-by would under-count silently.
   */
  otherPendingRequests: QueueSiblingRequest[]
}

/**
 * The four cards on the admin queue.
 *
 * Note the unit mismatch, which is deliberate and shown in the UI copy: three
 * of these count *requests* and `disputedMembers` counts distinct *people*.
 */
export type MemberRequestQueueStats = {
  pending: number
  /** People with more than one `pending` request. */
  disputedMembers: number
  /**
   * `pending` requests belonging to those people — the other half of the
   * disputed card's caption, "2 membros · 5 solicitações".
   *
   * Sent rather than read off the table's `total`, which counts the current
   * filter: the card describes the event, so its caption must not change when
   * someone types in the search box.
   */
  disputedRequests: number
  approved: number
  /**
   * `denied` only. Superseded requests are `outdated` and excluded, so this
   * never moves on an approval — a counter that rises when you approve someone
   * is one nobody trusts again.
   */
  denied: number
}

export type MemberRequestQueueFilters = {
  status?: MemberRequestStatus
  /**
   * Its own boolean, not a sixth `status`: a disputed request's status *is*
   * `pending`, and "disputed" describes the member rather than the request.
   */
  disputed?: boolean
  /** Matches the requested person's name or nickname, or the requester's name. */
  name?: string
  /** `team_templates.key`; the stable identifier a team keeps across events. */
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
