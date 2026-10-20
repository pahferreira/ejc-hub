import { AppError, AppErrorCode } from '../../../shared/AppError.ts'
import { runInTransaction } from '../../../core/database/client.ts'
import { isUniqueViolation } from '../../../shared/is-unique-violation.ts'
import { resolveNickname } from '../../../shared/resolve-nickname.ts'
import type { EventModel } from '../../../core/database/schemas/index.ts'
import type { EventRepository } from '../../../modules/event/domain/EventRepository.ts'
import type { SubscriptionRepository } from '../../../modules/subscription/domain/SubscriptionRepository.ts'
import type { TeamInstanceRepository } from '../../../modules/team-instance/domain/TeamInstanceRepository.ts'
import type { TeamMembershipRepository } from '../../../modules/team-membership/domain/TeamMembershipRepository.ts'
import type { UserRepository } from '../../../modules/user/domain/UserRepository.ts'
import type {
  MemberRequestRepository,
  MemberRequestRow,
} from '../../../modules/member-request/domain/MemberRequestRepository.ts'
import {
  MemberRequestStatus,
  type SettableRequestStatus,
} from '../../../modules/member-request/domain/member-request-status.ts'
import { listTeamCandidates } from '../../team-building/core/list-team-candidates.ts'
import { placeMembers } from '../../team-building/core/place-members.ts'
import type {
  CancelRequestResult,
  CreateRequestsResult,
  MemberRequestQueueFilters,
  MemberRequestQueueList,
  MemberRequestQueueRow,
  MyTeamRequestFilters,
  MyTeamRequestList,
  MyTeamRequestRow,
  QueueSiblingRequest,
  RequestActor,
  RequestPagination,
  RequestPerson,
  RequestableCandidateFilters,
  RequestableCandidateList,
  RequestableCandidateRow,
  ResolveRequestResult,
  TeamPreference,
} from '../domain/member-request.types.ts'
import {
  assertAdminCanResolve,
  assertCoordinatorCanCancel,
  assertRequestable,
} from './member-request-guards.ts'
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  filterRequestableCandidates,
  paginateRequestableCandidates,
  sortRequestableCandidates,
  toRequestableStats,
  toRowStatus,
} from './requestable-members.ts'
import {
  countQueueStats,
  filterQueueRows,
  paginateQueueRows,
  DEFAULT_PAGE as QUEUE_DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE as QUEUE_DEFAULT_PAGE_SIZE,
} from './member-request-queue.ts'
import { countMyTeamStats, filterMyTeamRows } from './member-request-my-team.ts'

const COORDINATOR_TYPE = 'coordinator'
const CANCELLED_SUBSCRIPTION = 'cancelled'

/**
 * The constraint that catches the race.
 *
 * One membership per user per event. An approval does not read whether the
 * person is already placed and then insert — a concurrent approval by another
 * team commits in exactly that gap. It inserts and lets this answer.
 */
const MEMBERSHIP_UNIQUE_CONSTRAINT = 'team_memberships_event_id_user_id_unique'

function toPerson(person: MemberRequestRow['user']): RequestPerson {
  return {
    userId: person.userId,
    name: person.name,
    nickname: resolveNickname(person.name, person.nickname),
    pictureUrl: person.pictureUrl,
    experienceType: person.experienceType,
    circleKey: person.circleKey,
  }
}

function toActor(actor: { name: string; nickname: string | null }): RequestActor {
  return { name: actor.name, nickname: resolveNickname(actor.name, actor.nickname) }
}

export class MemberRequest {
  #memberRequestRepository: MemberRequestRepository
  #eventRepository: EventRepository
  #subscriptionRepository: SubscriptionRepository
  #teamInstanceRepository: TeamInstanceRepository
  #teamMembershipRepository: TeamMembershipRepository
  #userRepository: UserRepository

  constructor(
    memberRequestRepo: MemberRequestRepository,
    eventRepo: EventRepository,
    subscriptionRepo: SubscriptionRepository,
    teamInstanceRepo: TeamInstanceRepository,
    teamMembershipRepo: TeamMembershipRepository,
    userRepo: UserRepository
  ) {
    this.#memberRequestRepository = memberRequestRepo
    this.#eventRepository = eventRepo
    this.#subscriptionRepository = subscriptionRepo
    this.#teamInstanceRepository = teamInstanceRepo
    this.#teamMembershipRepository = teamMembershipRepo
    this.#userRepository = userRepo
  }

  /**
   * The repositories the shared placement path needs.
   *
   * Approving a request places someone on a team, which is the *same* write
   * sequence the team-building board runs — `placeMembers` is the single
   * implementation of it, and this feature hands it the repositories it already
   * holds rather than importing team building's wired application object.
   */
  #placementDeps() {
    return {
      teamInstanceRepository: this.#teamInstanceRepository,
      teamMembershipRepository: this.#teamMembershipRepository,
      subscriptionRepository: this.#subscriptionRepository,
      memberRequestRepository: this.#memberRequestRepository,
    }
  }

  // Resolves the current event once per call and hands it to `fn`. The id is a
  // call-scoped local, never cached on the instance. Duplicated per feature by
  // convention — `TeamBuilding` and `Financial` each own one.
  async #withCurrentEvent<T>(fn: (event: EventModel) => Promise<T>): Promise<T> {
    const currentEvent = await this.#eventRepository.findCurrentEvent()

    if (!currentEvent) {
      throw new AppError('Current event not set')
    }

    return fn(currentEvent)
  }

  // Auth0 hands us a `sub`, never our own user id, so every entry point that
  // acts on behalf of someone has to resolve it before touching membership data.
  //
  // A plain `AppError` here answers 422 while every other failure in the same
  // path answers 403. Pre-existing and identical in `Financial`; not worth
  // changing a shipped contract for.
  async #resolveActor(actorAuthId: string) {
    const actor = await this.#userRepository.getUser(actorAuthId)

    if (!actor) {
      throw new AppError('User not found')
    }

    return actor
  }

  /**
   * The team the caller coordinates, or a 403.
   *
   * A user holds at most one membership per event, so the coordinator's team is
   * *derived* rather than passed in — which makes "coordinator files a request
   * against another team's roster" unrepresentable rather than something to
   * guard against.
   */
  async #resolveCoordinatedTeam(actorUserId: string, eventId: string): Promise<string> {
    const membership = await this.#teamMembershipRepository.findMembershipByUserAndEvent(
      actorUserId,
      eventId
    )

    if (!membership || membership.type !== COORDINATOR_TYPE) {
      throw new AppError(
        'Only a team coordinator can manage member requests for their team',
        AppErrorCode.Forbidden
      )
    }

    return membership.teamInstanceId
  }

  /**
   * The one place that decides who is listed.
   *
   * Today: only people with no membership in the event, because
   * `listTeamCandidates(…, 'member')` excludes them — so `assigned` never renders
   * and `assignedUserIds` is always empty. Widening this method (returning
   * placed subscribers, with their ids in that set) is the whole of the
   * "show already-placed people too" change — see the plan's G.2.
   */
  async #listEligibleSubscribers(eventId: string, teamInstanceId: string) {
    const result = await listTeamCandidates(
      {
        teamInstanceRepository: this.#teamInstanceRepository,
        teamMembershipRepository: this.#teamMembershipRepository,
        subscriptionRepository: this.#subscriptionRepository,
      },
      { eventId, teamInstanceId, role: 'member' }
    )

    return { candidates: result.candidates, assignedUserIds: new Set<string>() }
  }

  /**
   * Files a batch of requests for the caller's own team.
   *
   * All-or-nothing: one invalid target aborts the whole batch before anything is
   * written, so a coordinator is never told "3 of 5 went through".
   *
   * Capacity is deliberately not enforced, matching `addMembers` and
   * `applyAssignments` — warn-but-allow lives in the UI everywhere else in this
   * codebase, and a request path stricter than the board an admin can drag
   * people around on would be the odd one out.
   */
  async createRequests(
    actorAuthId: string,
    userIds: string[],
    message?: string
  ): Promise<CreateRequestsResult> {
    return this.#withCurrentEvent(async (event) => {
      const actor = await this.#resolveActor(actorAuthId)
      const teamInstanceId = await this.#resolveCoordinatedTeam(actor.id, event.id)

      // Deduped before validation, so a repeated id is not checked twice, and
      // before the write, so the batch matches what the caller is told.
      const deduped = [...new Set(userIds)]

      if (deduped.length === 0) {
        throw new AppError('At least one member is required')
      }

      const openRequests = await this.#memberRequestRepository.listOpenRequestsByTeamAndUsers(
        teamInstanceId,
        deduped
      )
      const alreadyRequested = new Set(openRequests.map((request) => request.userId))

      const checks = await Promise.all(
        deduped.map(async (userId) => {
          const [subscription, membership] = await Promise.all([
            this.#subscriptionRepository.getSubscriptionByUserAndEvent(userId, event.id),
            this.#teamMembershipRepository.findMembershipByUserAndEvent(userId, event.id),
          ])

          return {
            userId,
            hasActiveSubscription:
              subscription !== undefined && subscription.status !== CANCELLED_SUBSCRIPTION,
            hasMembership: membership !== undefined,
            hasOpenRequestOnTeam: alreadyRequested.has(userId),
          }
        })
      )

      // Every read and every throw is above this line; the transaction below
      // holds writes only.
      for (const check of checks) {
        assertRequestable(check)
      }

      const requestIds = await runInTransaction((tx) =>
        this.#memberRequestRepository.insertMemberRequests(
          deduped.map((userId) => ({
            userId,
            teamInstanceId,
            eventId: event.id,
            requestedBy: actor.id,
            message,
          })),
          tx
        )
      )

      return { requestIds, requestedCount: requestIds.length }
    })
  }

  /**
   * Who the coordinator may ask for, with the team's counts and one page of rows.
   *
   * One endpoint feeds the whole screen. `stats` is computed from the unfiltered
   * set, because the cards describe the team rather than the current filter.
   */
  async listRequestableCandidates(
    actorAuthId: string,
    filters: RequestableCandidateFilters = {},
    pagination: RequestPagination = {}
  ): Promise<RequestableCandidateList> {
    return this.#withCurrentEvent(async (event) => {
      const actor = await this.#resolveActor(actorAuthId)
      const teamInstanceId = await this.#resolveCoordinatedTeam(actor.id, event.id)

      const instances = await this.#teamInstanceRepository.listTeamInstancesWithDetails(event.id)
      const instance = instances.find((candidate) => candidate.id === teamInstanceId)

      if (!instance) {
        throw new AppError(`Team instance ${teamInstanceId} does not belong to the current event`)
      }

      const instanceNameById = new Map(
        instances.map((candidate) => [candidate.id, candidate.templateName])
      )

      const [eligible, teamRequests, memberIdsByTeam, coordinatorIds] = await Promise.all([
        this.#listEligibleSubscribers(event.id, teamInstanceId),
        this.#memberRequestRepository.listRequestsByTeamInstance(teamInstanceId),
        this.#teamMembershipRepository.listMemberUserIdsByTeamInstanceIds([teamInstanceId]),
        this.#teamMembershipRepository.getCoordinatorUserIds(teamInstanceId),
      ])

      // Coordinators hold a membership and count against capacity, exactly as
      // the Teams page counts them.
      const memberCount = new Set([
        ...(memberIdsByTeam.get(teamInstanceId) ?? []),
        ...coordinatorIds,
      ]).size

      const pendingRequestUserIds = new Set(
        teamRequests
          .filter((request) => request.status === MemberRequestStatus.Pending)
          .map((request) => request.user.userId)
      )
      const approvedRequests = teamRequests.filter(
        (request) => request.status === MemberRequestStatus.Approved
      ).length

      const rows: RequestableCandidateRow[] = eligible.candidates.map((candidate) => ({
        userId: candidate.userId,
        name: candidate.name,
        nickname: candidate.nickname,
        pictureUrl: candidate.pictureUrl,
        experienceType: candidate.experienceType,
        circleKey: candidate.circleKey,
        areas: candidate.areas,
        // Zipped here against the instance names rather than against
        // `Candidate.preferences`, which silently drops ids that no longer name
        // a team of this event and so does not line up by index.
        preferences: candidate.preferenceTeamIds.reduce<TeamPreference[]>((acc, preferenceId) => {
          const name = instanceNameById.get(preferenceId)

          if (name) {
            acc.push({ teamInstanceId: preferenceId, name })
          }

          return acc
        }, []),
        rowStatus: toRowStatus({
          hasMembership: eligible.assignedUserIds.has(candidate.userId),
          hasOpenRequestFromTeam: pendingRequestUserIds.has(candidate.userId),
        }),
      }))

      // Stats first — they describe the team, not the filter. Then filter, sort
      // and only then slice: sorting a page is how page 2 ends up showing rows
      // page 1 owed.
      const stats = toRequestableStats({
        memberCount,
        maxCapacity: instance.maxCapacity,
        pendingRequests: pendingRequestUserIds.size,
        approvedRequests,
      })

      const filtered = filterRequestableCandidates(rows, filters, teamInstanceId)
      const sorted = sortRequestableCandidates(filtered)
      const page = pagination.page ?? DEFAULT_PAGE
      const pageSize = pagination.pageSize ?? DEFAULT_PAGE_SIZE

      return {
        team: {
          id: instance.id,
          name: instance.templateName,
          memberCount,
          maxCapacity: instance.maxCapacity,
          freeSlots: stats.freeSlots,
        },
        stats,
        items: paginateRequestableCandidates(sorted, page, pageSize),
        total: filtered.length,
        page,
        pageSize,
      }
    })
  }

  /**
   * Every request the caller's team ever filed, newest first, with the three
   * card counts and the search/status filter.
   *
   * `stats` is computed from the unfiltered set, before `filters` narrows
   * `items` — the house invariant this page shares with the admin queue (plan
   * I.2).
   */
  async listMyTeamRequests(
    actorAuthId: string,
    filters: MyTeamRequestFilters = {}
  ): Promise<MyTeamRequestList> {
    return this.#withCurrentEvent(async (event) => {
      const actor = await this.#resolveActor(actorAuthId)
      const teamInstanceId = await this.#resolveCoordinatedTeam(actor.id, event.id)

      const rows = await this.#memberRequestRepository.listRequestsByTeamInstance(teamInstanceId)

      const items: MyTeamRequestRow[] = rows.map((row) => ({
        id: row.id,
        status: row.status,
        user: toPerson(row.user),
        requestedBy: toActor(row.requestedBy),
        message: row.message,
        requestedAt: row.requestedAt,
        resolvedAt: row.resolvedAt,
        resolutionReason: row.resolutionReason,
      }))

      const stats = countMyTeamStats(items)
      const filtered = filterMyTeamRows(items, filters)

      return { stats, items: filtered, total: filtered.length }
    })
  }

  /**
   * Withdraws one of the caller's own team's pending requests.
   *
   * `cancelled` carries the coordinator's id: unlike the system-written
   * `outdated`, somebody decided this.
   */
  async cancelRequest(actorAuthId: string, requestId: string): Promise<CancelRequestResult> {
    return this.#withCurrentEvent(async (event) => {
      const actor = await this.#resolveActor(actorAuthId)
      const teamInstanceId = await this.#resolveCoordinatedTeam(actor.id, event.id)

      const request = await this.#memberRequestRepository.getMemberRequest(requestId)

      assertCoordinatorCanCancel(request, { eventId: event.id, teamInstanceId })

      await runInTransaction((tx) =>
        this.#memberRequestRepository.resolveRequests(
          {
            requestIds: [requestId],
            status: MemberRequestStatus.Cancelled,
            resolvedAt: new Date(),
            resolvedBy: actor.id,
          },
          tx
        )
      )

      return { requestId, status: MemberRequestStatus.Cancelled }
    })
  }

  /**
   * The admin queue: the four card counts, and one filtered page of requests.
   *
   * No actor parameter — the route's permission is the whole authorization rule,
   * matching the `Financial` reads.
   *
   * Reads the event once and narrows in memory, the same split as
   * `member-fee-list.ts`. Counting in SQL and paging in SQL would be two queries
   * that can disagree under a concurrent approval, which is precisely the moment
   * this page is being looked at.
   */
  async listCurrentEventRequests(
    filters: MemberRequestQueueFilters = {},
    pagination: RequestPagination = {}
  ): Promise<MemberRequestQueueList> {
    return this.#withCurrentEvent(async (event) => {
      const [rows, instances] = await Promise.all([
        this.#memberRequestRepository.listRequestsByEvent(event.id),
        this.#teamInstanceRepository.listTeamInstancesWithDetails(event.id),
      ])

      const instanceIds = instances.map((instance) => instance.id)
      const [memberIdsByTeam, coordinatorIdsByTeam] = await Promise.all([
        this.#teamMembershipRepository.listMemberUserIdsByTeamInstanceIds(instanceIds),
        this.#teamMembershipRepository.listCoordinatorIdsByTeamInstanceIds(instanceIds),
      ])

      const teamKeyByInstanceId = new Map(
        instances.map((instance) => [instance.id, instance.templateKey])
      )
      const teamById = new Map(
        instances.map((instance) => {
          const memberCount = new Set([
            ...(memberIdsByTeam.get(instance.id) ?? []),
            ...(coordinatorIdsByTeam.get(instance.id) ?? []),
          ]).size

          return [
            instance.id,
            {
              id: instance.id,
              name: instance.templateName,
              // Display only. Capacity is never enforced on approve, so this
              // can legitimately read 0 for a team an admin is still filling.
              freeSlots: Math.max(0, instance.maxCapacity - memberCount),
            },
          ]
        })
      )

      // Grouped over the whole event, not the page: a rival request may sit on
      // another page entirely, so a client-side group-by would under-count.
      const pendingByUserId = new Map<string, MemberRequestRow[]>()
      for (const row of rows) {
        if (row.status !== MemberRequestStatus.Pending) {
          continue
        }

        const siblings = pendingByUserId.get(row.user.userId) ?? []
        siblings.push(row)
        pendingByUserId.set(row.user.userId, siblings)
      }

      const toSibling = (row: MemberRequestRow): QueueSiblingRequest => ({
        id: row.id,
        team: teamById.get(row.teamInstanceId) ?? { id: row.teamInstanceId, name: '' },
        requestedBy: toActor(row.requestedBy),
      })

      const items: MemberRequestQueueRow[] = rows.map((row) => ({
        id: row.id,
        status: row.status,
        user: toPerson(row.user),
        team: teamById.get(row.teamInstanceId) ?? {
          id: row.teamInstanceId,
          name: '',
          freeSlots: 0,
        },
        requestedBy: toActor(row.requestedBy),
        message: row.message,
        requestedAt: row.requestedAt,
        resolvedAt: row.resolvedAt,
        resolvedBy: row.resolvedBy ? toActor(row.resolvedBy) : null,
        resolutionReason: row.resolutionReason,
        otherPendingRequests: (pendingByUserId.get(row.user.userId) ?? [])
          .filter((sibling) => sibling.id !== row.id)
          .map(toSibling),
      }))

      const stats = countQueueStats(items)
      const filtered = filterQueueRows(items, filters, teamKeyByInstanceId)
      const page = pagination.page ?? QUEUE_DEFAULT_PAGE
      const pageSize = pagination.pageSize ?? QUEUE_DEFAULT_PAGE_SIZE

      return {
        stats,
        items: paginateQueueRows(filtered, page, pageSize),
        total: filtered.length,
        page,
        pageSize,
      }
    })
  }

  /**
   * An admin's answer to one request: approve, which places the person, or deny.
   *
   * **Deny is a single write.** No membership, no outdating — a denial answers
   * only this request, and the person stays available to every other team.
   *
   * **Approve is a transaction, and the step order is load-bearing.**
   */
  async resolveRequest(
    actorAuthId: string,
    requestId: string,
    status: SettableRequestStatus,
    resolutionReason?: string
  ): Promise<ResolveRequestResult> {
    return this.#withCurrentEvent(async (event) => {
      const actor = await this.#resolveActor(actorAuthId)
      const request = await this.#memberRequestRepository.getMemberRequest(requestId)

      // Every read and every throw is above the transaction.
      const target = assertAdminCanResolve(request, event.id)
      const resolvedAt = new Date()

      if (status === 'denied') {
        await runInTransaction((tx) =>
          this.#memberRequestRepository.resolveRequests(
            {
              requestIds: [requestId],
              status: MemberRequestStatus.Denied,
              resolvedAt,
              resolvedBy: actor.id,
              resolutionReason,
            },
            tx
          )
        )

        return { requestId, status, supersededRequestIds: [] }
      }

      try {
        const supersededRequestIds = await runInTransaction(async (tx) => {
          // ORDER IS LOAD-BEARING, and nothing about the code makes it visible.
          //
          // `addMembers` outdates open requests scoped to `status = 'pending'`.
          // Marking this one `approved` first is what makes its own row skipped
          // naturally. Swap these two lines and an approval silently outdates
          // itself — `addMembers` takes no `exceptRequestId`, and adding one
          // just to express this would be the more fragile option.
          await this.#memberRequestRepository.resolveRequests(
            {
              requestIds: [requestId],
              status: MemberRequestStatus.Approved,
              resolvedAt,
              resolvedBy: actor.id,
              resolutionReason,
            },
            tx
          )

          // Inserts the membership, completes the subscription ("montado"), and
          // outdates the person's other open requests — the ids of which are
          // this approval's `supersededRequestIds`. The same call the board
          // makes, so there is one membership write path, not two.
          return placeMembers(this.#placementDeps(), {
            eventId: event.id,
            teamInstanceId: target.teamInstanceId,
            userIds: [target.user.userId],
            // Joins the transaction this approval already opened, rather than
            // taking a second connection.
            executor: tx,
          })
        })

        return { requestId, status, supersededRequestIds }
      } catch (error) {
        // Outside the transaction on purpose: a failed statement aborts the
        // whole Postgres transaction, and every subsequent statement errors
        // with 25P02 until it rolls back — so catch-and-continue inside is
        // impossible. By the time we are here the rollback has happened and
        // this request is still `pending`.
        if (isUniqueViolation(error, MEMBERSHIP_UNIQUE_CONSTRAINT)) {
          throw new AppError(
            `${target.user.name} already holds a team membership in this event`,
            AppErrorCode.MemberAlreadyAssigned
          )
        }

        throw error
      }
    })
  }
}
