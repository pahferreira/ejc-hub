import { AppError, AppErrorCode } from '../../../shared/AppError.ts'
import type { EventModel } from '../../../core/database/schemas/index.ts'
import type { EventRepository } from '../../../modules/event/domain/EventRepository.ts'
import type {
  EventFeePaymentRepository,
  MemberFeeStatusRow,
} from '../../../modules/event-fee-payment/domain/EventFeePaymentRepository.ts'
import {
  toMemberFeeStanding,
  toSettableFeeStatus,
  type SettableFeeStatus,
} from '../../../modules/event-fee-payment/domain/fee-payment-status.ts'
import type { TeamMembershipRepository } from '../../../modules/team-membership/domain/TeamMembershipRepository.ts'
import type { UserRepository } from '../../../modules/user/domain/UserRepository.ts'
import { comparePeopleByNickname } from '../../../shared/compare-people-by-nickname.ts'
import { resolveNickname } from '../../../shared/resolve-nickname.ts'
import type {
  EventFeeMemberFilters,
  EventFeeMemberList,
  EventFeeMemberPagination,
  EventFeeMemberRow,
  EventFeeCounts,
  EventFeeMembersOverview,
  EventFeeTeamsOverview,
  EventFeeRates,
  FeeStatusUpdateResult,
  TeamFeeRow,
} from '../domain/event-fee.types.ts'
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  filterMemberFees,
  paginateMemberFees,
} from './member-fee-list.ts'
import { toFeeRates } from './fee-rates.ts'

const COORDINATOR_TYPE = 'coordinator'
const PAID_STATUS = 'paid' as const

function toPercentage(paid: number, total: number): number {
  if (total <= 0) {
    return 0
  }

  return Math.round((paid / total) * 100)
}

// The repository speaks in stored columns; the page speaks in people. This is
// the one place the two are reconciled, so a new consumer of the member list
// cannot invent its own nickname fallback or its own idea of "paid".
function toMemberRow(row: MemberFeeStatusRow): EventFeeMemberRow {
  return {
    userId: row.userId,
    name: row.name,
    nickname: resolveNickname(row.name, row.nickname),
    phone: row.phone,
    pictureUrl: row.pictureUrl,
    experienceType: row.experienceType,
    circleKey: row.circleKey,
    membershipType: row.membershipType,
    teamId: row.teamId,
    teamKey: row.teamKey,
    teamName: row.teamName,
    status: toMemberFeeStanding(row.feeStatus),
    // Both readings of the same column: the fold the list acts on, and the
    // stored status the review dialog preselects.
    paymentStatus: toSettableFeeStatus(row.feeStatus),
  }
}

export class Financial {
  #eventFeePaymentRepository: EventFeePaymentRepository
  #eventRepository: EventRepository
  #teamMembershipRepository: TeamMembershipRepository
  #userRepository: UserRepository

  constructor(
    eventFeePaymentRepo: EventFeePaymentRepository,
    eventRepo: EventRepository,
    teamMembershipRepo: TeamMembershipRepository,
    userRepo: UserRepository
  ) {
    this.#eventFeePaymentRepository = eventFeePaymentRepo
    this.#eventRepository = eventRepo
    this.#teamMembershipRepository = teamMembershipRepo
    this.#userRepository = userRepo
  }

  // Resolves the current event once per call and hands it to `fn`. The id is a
  // call-scoped local, never cached on the instance.
  async #withCurrentEvent<T>(fn: (event: EventModel) => Promise<T>): Promise<T> {
    const currentEvent = await this.#eventRepository.findCurrentEvent()

    if (!currentEvent) {
      throw new AppError('Current event not set')
    }

    return fn(currentEvent)
  }

  /**
   * The counts behind the "Taxa por Membro" cards.
   *
   * Reads the same per-team aggregate the teams overview does and throws the
   * breakdown away. That is deliberate: one SQL aggregate is the single place
   * "how many paid" is decided, so the two pages cannot drift into disagreeing
   * about the same event.
   */
  async getCurrentEventMembersOverview(): Promise<EventFeeMembersOverview> {
    return this.#withCurrentEvent(async (event) => {
      const teams = await this.#aggregateTeams(event.id)
      const counts = this.#countsFrom(teams)

      return { ...counts, ...this.#ratesFrom(counts) }
    })
  }

  /**
   * Everything the "Taxa de Inscrição" page shows: the counts, the per-team
   * table, and the money.
   */
  async getCurrentEventTeamsOverview(): Promise<EventFeeTeamsOverview> {
    return this.#withCurrentEvent(async (event) => {
      const teams = await this.#aggregateTeams(event.id)
      const counts = this.#countsFrom(teams)

      return {
        // Rates, not counts: the head counts stay on the by-member page, and the
        // per-team table below carries the absolute numbers for this one.
        ...this.#ratesFrom(counts),
        collectedCents: teams.reduce((sum, team) => sum + team.collectedCents, 0),
        // Only the members who owe: an exemption removes that person's fee from
        // the target rather than leaving it permanently outstanding.
        expectedCents: event.feeAmountCents * (counts.totalMembers - counts.exemptCount),
        currency: event.feeCurrency,
        teams: teams.map((team) => team.row),
      }
    })
  }

  // One query, one shape, sorted once. Both overviews start here so that "how
  // many paid" is answered by a single `filter (where ...)` in one place.
  async #aggregateTeams(eventId: string) {
    const rows = await this.#eventFeePaymentRepository.aggregateFeeStatusByTeam(eventId)

    return rows
      .map((row) => ({
        collectedCents: row.collectedCents,
        row: {
          teamId: row.teamId,
          teamKey: row.teamKey,
          teamName: row.teamName,
          total: row.total,
          paid: row.paid,
          exempt: row.exempt,
          // The three partition the team, so a member with no payment row at all
          // lands here rather than vanishing from the totals.
          pending: row.total - row.paid - row.exempt,
          paidPercentage: toPercentage(row.paid, row.total),
        } satisfies TeamFeeRow,
      }))
      .sort((first, second) => first.row.teamName.localeCompare(second.row.teamName))
  }

  // Derived from the counts rather than the rows, so the rates and the
  // by-member page's head counts are two readings of one aggregate.
  #ratesFrom(counts: EventFeeCounts): EventFeeRates {
    return toFeeRates({
      paid: counts.paidCount,
      exempt: counts.exemptCount,
      pending: counts.pendingCount,
    })
  }

  // Summed from the team rows rather than queried again: every membership
  // belongs to exactly one team instance, so the totals agree by construction.
  #countsFrom(teams: { row: TeamFeeRow }[]): EventFeeCounts {
    const totalMembers = teams.reduce((sum, team) => sum + team.row.total, 0)
    const paidCount = teams.reduce((sum, team) => sum + team.row.paid, 0)
    const exemptCount = teams.reduce((sum, team) => sum + team.row.exempt, 0)

    return {
      totalMembers,
      paidCount,
      exemptCount,
      pendingCount: totalMembers - paidCount - exemptCount,
    }
  }

  /**
   * The current event's team members with their fee standing, filtered and paged.
   *
   * Reads the whole event once and narrows in memory, the same shape as
   * `Events.listCurrentEventSubscriptions`. That keeps the stat cards and the
   * page on screen derived from one snapshot: counting in SQL and paging in SQL
   * would be two queries that can disagree under a concurrent confirmation.
   *
   * `stats` covers the filtered set rather than the whole event, because the
   * cards sit directly above the table and read as a summary of it — which is
   * also why `stats.totalMembers` and `total` are the same number.
   */
  async listCurrentEventMemberFees(
    filters: EventFeeMemberFilters = {},
    pagination: EventFeeMemberPagination = {}
  ): Promise<EventFeeMemberList> {
    return this.#withCurrentEvent(async (event) => {
      const rows = await this.#eventFeePaymentRepository.listMemberFeeStatus(event.id)
      // Sorted here rather than in SQL because the nickname it orders by does
      // not exist until `toMemberRow` resolves it, and after filtering rather
      // than before so the sort never touches rows it is about to discard.
      const filtered = filterMemberFees(rows.map(toMemberRow), filters).sort(
        comparePeopleByNickname
      )

      const page = pagination.page ?? DEFAULT_PAGE
      const pageSize = pagination.pageSize ?? DEFAULT_PAGE_SIZE

      return {
        items: paginateMemberFees(filtered, page, pageSize),
        total: filtered.length,
        page,
        pageSize,
      }
    })
  }

  // Auth0 hands us a `sub`, never our own user id, so every entry point that
  // acts on behalf of someone has to resolve it before touching membership data.
  async #resolveActor(actorAuthId: string) {
    const actor = await this.#userRepository.getUser(actorAuthId)

    if (!actor) {
      throw new AppError('User not found')
    }

    return actor
  }

  /**
   * Narrows a coordinator to the team they actually coordinate.
   *
   * A user holds at most one membership per event (enforced by a unique on
   * `team_memberships`), so coordinating is single-team by construction — there
   * is no set of teams to union here.
   */
  async #assertCoordinatesTargets(actorUserId: string, eventId: string, targetUserIds: string[]) {
    const membership = await this.#teamMembershipRepository.findMembershipByUserAndEvent(
      actorUserId,
      eventId
    )

    if (!membership || membership.type !== COORDINATOR_TYPE) {
      throw new AppError(
        'Only a team coordinator can confirm fees for their team',
        AppErrorCode.Forbidden
      )
    }

    const [memberIdsByTeam, coordinatorIds] = await Promise.all([
      this.#teamMembershipRepository.listMemberUserIdsByTeamInstanceIds([
        membership.teamInstanceId,
      ]),
      this.#teamMembershipRepository.getCoordinatorUserIds(membership.teamInstanceId),
    ])

    // Coordinators owe the fee too and appear in the team's own list, so the
    // roster a coordinator may confirm is members *and* their fellow coordinators.
    const teamUserIds = new Set([
      ...(memberIdsByTeam.get(membership.teamInstanceId) ?? []),
      ...coordinatorIds,
    ])

    const outsider = targetUserIds.find((userId) => !teamUserIds.has(userId))

    if (outsider) {
      // Deliberately does not say whether the id exists: a coordinator has no
      // business learning about people outside their team from this endpoint.
      throw new AppError(
        'Cannot confirm a fee for someone outside your team',
        AppErrorCode.Forbidden
      )
    }
  }

  // The single write path behind every fee-status route, so the coordinator and
  // admin sides cannot drift in how a payment record is written.
  async #setFeeStatus(
    event: EventModel,
    actorUserId: string,
    userIds: string[],
    status: SettableFeeStatus
  ): Promise<FeeStatusUpdateResult> {
    const updatedUserIds = await this.#eventFeePaymentRepository.setPaymentsStatus({
      eventId: event.id,
      userIds,
      status,
      recordedBy: actorUserId,
      amountCents: event.feeAmountCents,
    })

    return { updatedUserIds, updatedCount: updatedUserIds.length }
  }

  /**
   * Confirms fees for members of the caller's own team.
   *
   * Backs both coordinator endpoints: the single-member route passes a one-item
   * list, so one member and a batch are the same operation.
   *
   * Fixed to `paid` on purpose. Comping someone (`exempt`) is a financial
   * decision and recording a non-payment (`not_paid`) is a treasury judgement;
   * neither belongs to a team coordinator, so the status is not a parameter here.
   */
  async confirmTeamFeesAsCoordinator(
    actorAuthId: string,
    userIds: string[]
  ): Promise<FeeStatusUpdateResult> {
    return this.#withCurrentEvent(async (event) => {
      const actor = await this.#resolveActor(actorAuthId)
      // Deduped before the guard so a repeated id cannot be checked twice, and
      // before the write so the batch matches what the caller is told.
      const deduped = [...new Set(userIds)]

      await this.#assertCoordinatesTargets(actor.id, event.id, deduped)

      return this.#setFeeStatus(event, actor.id, deduped, PAID_STATUS)
    })
  }

  /**
   * Sets any settable fee status for anyone in the current event.
   *
   * No team scoping: the route gates this on `financials-event-fee:create`
   * instead. The status is a parameter because a treasurer legitimately needs
   * the whole range — comping, reversing a mistaken confirmation, or recording
   * a verified non-payment.
   */
  async setFeeStatusAsAdmin(
    actorAuthId: string,
    userIds: string[],
    status: SettableFeeStatus
  ): Promise<FeeStatusUpdateResult> {
    return this.#withCurrentEvent(async (event) => {
      const actor = await this.#resolveActor(actorAuthId)

      return this.#setFeeStatus(event, actor.id, [...new Set(userIds)], status)
    })
  }
}
