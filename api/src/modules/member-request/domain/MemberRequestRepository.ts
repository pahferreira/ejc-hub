import type { DbExecutor } from '../../../core/database/client.ts'
import type { experienceType } from '../../../core/database/schemas/users.ts'
import type { MemberRequestStatus } from './member-request-status.ts'

// Derived from the DB enum: modules do not import from features.
type ExperienceType = (typeof experienceType.enumValues)[number]

export type InsertMemberRequestInput = {
  userId: string
  teamInstanceId: string
  eventId: string
  /** The coordinator filing the request; never null. */
  requestedBy: string
  message?: string | null
}

/** A person as every request list renders them: no phone, no email. */
export type MemberRequestPerson = {
  userId: string
  name: string
  /** Raw column value; may be null, in which case the caller falls back. */
  nickname: string | null
  pictureUrl: string | null
  experienceType: ExperienceType
  /** Key of the person's circle (newbies only); null when unset. */
  circleKey: string | null
}

/**
 * One request, joined to the people and the team it names.
 *
 * `resolvedBy` is null for `pending` — nobody has answered — and for `outdated`,
 * where the system closed it and there is no admin to name. Those two are the
 * whole reason the join is a `leftJoin`.
 */
export type MemberRequestRow = {
  id: string
  status: MemberRequestStatus
  eventId: string
  teamInstanceId: string
  user: MemberRequestPerson
  requestedBy: { userId: string; name: string; nickname: string | null }
  message: string | null
  /** `created_at`: when the coordinator filed it. */
  requestedAt: Date
  resolvedAt: Date | null
  resolvedBy: { userId: string; name: string; nickname: string | null } | null
  resolutionReason: string | null
}

/** The minimum needed to tell a coordinator "you already asked for this person". */
export type OpenMemberRequest = {
  id: string
  userId: string
  teamInstanceId: string
}

export type ResolveMemberRequestsInput = {
  requestIds: string[]
  status: MemberRequestStatus
  resolvedAt: Date
  /** The admin or coordinator who decided; null when the system did. */
  resolvedBy: string | null
  resolutionReason?: string | null
}

export type OutdateOpenRequestsInput = {
  eventId: string
  /** Everyone who just took a membership in the event. */
  userIds: string[]
}

/** Optional narrowing for the event-wide read. */
export type MemberRequestEventFilters = {
  statuses?: MemberRequestStatus[]
}

export interface MemberRequestRepository {
  /**
   * Files a batch of requests in one statement.
   *
   * Returns the new ids in insertion order. An empty input returns `[]` without
   * querying: `insert ... values ()` is a syntax error, and "nobody was
   * requested" is a legitimate no-op rather than a failure.
   */
  insertMemberRequests: (
    inputs: InsertMemberRequestInput[],
    executor?: DbExecutor
  ) => Promise<string[]>

  /** One request with its joins, or `undefined` when the id names nothing. */
  getMemberRequest: (id: string) => Promise<MemberRequestRow | undefined>

  /**
   * The `pending` requests one team already holds for any of these people.
   *
   * Create-time validation: the partial unique index is the real guarantee, but
   * hitting it gives a driver error rather than a message naming the person.
   */
  listOpenRequestsByTeamAndUsers: (
    teamInstanceId: string,
    userIds: string[]
  ) => Promise<OpenMemberRequest[]>

  /**
   * Every request ever filed by one team, newest first.
   *
   * All statuses: the coordinator's own queue shows the answers as well as the
   * open asks, and the "Solicitar Membros" cards count the pending and approved
   * ones out of this same list.
   */
  listRequestsByTeamInstance: (teamInstanceId: string) => Promise<MemberRequestRow[]>

  /**
   * Every request in one event, newest first.
   *
   * Returns the whole event unfiltered by default, matching
   * `listMemberFeeStatus`: the admin queue's filtering, `disputed` grouping,
   * counts and paging are pure functions above this, so the cards and the page
   * are derived from one snapshot rather than from two queries that can
   * disagree under a concurrent approval.
   *
   * `filters` is a narrowing for callers that do **not** need those event-wide
   * counts; the queue passes none.
   */
  listRequestsByEvent: (
    eventId: string,
    filters?: MemberRequestEventFilters
  ) => Promise<MemberRequestRow[]>

  /**
   * Closes the named requests, but only while they are still `pending`.
   *
   * A compare-and-set, not a blind update: a double-submitted approval finds the
   * row already `approved` and writes nothing, rather than restamping
   * `resolved_at` and `resolved_by` with a second decision nobody made.
   *
   * Returns the ids actually written, which is the honest answer to what
   * changed — the caller's list is only an intent.
   */
  resolveRequests: (input: ResolveMemberRequestsInput, executor?: DbExecutor) => Promise<string[]>

  /**
   * Marks every open request for these people in this event `outdated`.
   *
   * Called from every path that writes a `team_memberships` row: once someone
   * holds a membership in the event, a request asking for them is unanswerable.
   * Set-based — one statement regardless of how many people were placed.
   *
   * Writes a null `resolved_by` with the system reason, never `denied`. The
   * status, the null resolver and the reason travel together, so they are the
   * repository's to write rather than a caller's to choose.
   *
   * **Returns the ids it closed.** An approval has to report them to the client
   * as `supersededRequestIds`, and a statement that closes rows silently cannot.
   */
  outdateOpenRequestsForUsers: (
    input: OutdateOpenRequestsInput,
    executor?: DbExecutor
  ) => Promise<string[]>

  /**
   * Closes one person's open requests in one event as `cancelled`.
   *
   * For subscription cancellation: the person is not coming, so nobody should be
   * able to approve them onto a team. `cancelled` rather than `outdated` because
   * nothing was placed — the ask simply stopped being a real ask.
   *
   * Written by the system, so a null `resolved_by`. Re-confirming the
   * subscription does not resurrect these; the coordinator asks again.
   */
  cancelOpenRequestsByUserAndEvent: (
    userId: string,
    eventId: string,
    executor?: DbExecutor
  ) => Promise<string[]>
}
