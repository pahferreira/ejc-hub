import { AppError } from '../../../shared/AppError.ts'
import { comparePeopleByNickname } from '../../../shared/compare-people-by-nickname.ts'
import { runInTransaction, type DbExecutor } from '../../../core/database/client.ts'
import type { EventModel } from '../../../core/database/schemas/index.ts'
import type { TeamInstanceRepository } from '../../../modules/team-instance/domain/TeamInstanceRepository.ts'
import type { TeamMembershipRepository } from '../../../modules/team-membership/domain/TeamMembershipRepository.ts'
import type { SubscriptionRepository } from '../../../modules/subscription/domain/SubscriptionRepository.ts'
import type { EventRepository } from '../../../modules/event/domain/EventRepository.ts'
import type { MemberRequestRepository } from '../../../modules/member-request/domain/MemberRequestRepository.ts'
import { mapSubscriptionToPerson } from '../../event/core/subscription-to-person.ts'
import { listTeamCandidates } from './list-team-candidates.ts'
import { placeMembers } from './place-members.ts'
import {
  COMPLETED_STATUS,
  UNASSIGNED_STATUS,
  WAITING_LIST_STATUS,
  type AssignmentChange,
  type CandidateListResult,
  type CandidateRole,
  type TeamBoard,
  type TeamBoardColumn,
  type TeamBoardMember,
} from '../domain/board.types.ts'

type SubscriptionRow = Awaited<
  ReturnType<SubscriptionRepository['listSubscriptionsByEventId']>
>[number]

export class TeamBuilding {
  #teamInstanceRepository: TeamInstanceRepository
  #teamMembershipRepository: TeamMembershipRepository
  #subscriptionRepository: SubscriptionRepository
  #eventRepository: EventRepository
  #memberRequestRepository: MemberRequestRepository

  constructor(
    teamInstanceRepo: TeamInstanceRepository,
    teamMembershipRepo: TeamMembershipRepository,
    subscriptionRepo: SubscriptionRepository,
    eventRepo: EventRepository,
    memberRequestRepo: MemberRequestRepository
  ) {
    this.#teamInstanceRepository = teamInstanceRepo
    this.#teamMembershipRepository = teamMembershipRepo
    this.#subscriptionRepository = subscriptionRepo
    this.#eventRepository = eventRepo
    this.#memberRequestRepository = memberRequestRepo
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

  async getCurrentEventBoard(): Promise<TeamBoard> {
    return this.#withCurrentEvent(async (event) => {
      const [subscriptions, instances] = await Promise.all([
        this.#subscriptionRepository.listSubscriptionsByEventId(event.id),
        this.#teamInstanceRepository.listTeamInstancesWithDetails(event.id),
      ])

      const instanceNameById = new Map(
        instances.map((instance) => [instance.id, instance.templateName])
      )
      const membershipUserIdsByTeam =
        await this.#teamMembershipRepository.listMemberUserIdsByTeamInstanceIds(
          instances.map((instance) => instance.id)
        )
      const coordinatorIdsByTeam =
        await this.#teamMembershipRepository.listCoordinatorIdsByTeamInstanceIds(
          instances.map((instance) => instance.id)
        )

      // Invert the membership map so we can find each user's team in one lookup.
      const teamByUserId = new Map<string, string>()
      for (const [teamInstanceId, userIds] of membershipUserIdsByTeam) {
        for (const userId of userIds) {
          teamByUserId.set(userId, teamInstanceId)
        }
      }

      const subscriptionByUserId = new Map(subscriptions.map((sub) => [sub.userId, sub]))

      const toMember = (subscription: SubscriptionRow, isCoordinator = false): TeamBoardMember => ({
        subscriptionId: subscription.id,
        ...mapSubscriptionToPerson(subscription, instanceNameById),
        isCoordinator: isCoordinator || undefined,
      })

      const unassigned: TeamBoardMember[] = []
      const waitingList: TeamBoardMember[] = []
      const membersByTeam = new Map<string, TeamBoardMember[]>()

      for (const subscription of subscriptions) {
        const teamInstanceId = teamByUserId.get(subscription.userId)

        // A member with a team membership for the event always sits in that team
        // column, regardless of subscription status.
        if (teamInstanceId && instanceNameById.has(teamInstanceId)) {
          const members = membersByTeam.get(teamInstanceId) ?? []
          members.push(toMember(subscription))
          membersByTeam.set(teamInstanceId, members)
          continue
        }

        if (subscription.status === WAITING_LIST_STATUS) {
          waitingList.push(toMember(subscription))
          continue
        }

        if (subscription.status === UNASSIGNED_STATUS) {
          unassigned.push(toMember(subscription))
        }
      }

      // Sorted only once every subscription has been dealt into its column: the
      // loop above appends in subscription order, which is no order at all to
      // the coordinator reading the board.
      unassigned.sort(comparePeopleByNickname)
      waitingList.sort(comparePeopleByNickname)

      const columns: TeamBoardColumn[] = [
        {
          id: 'unassigned',
          kind: 'unassigned',
          title: 'Sem Equipe',
          description: 'Sem equipe nem lista de espera',
          count: unassigned.length,
          members: unassigned,
        },
        {
          id: 'waiting_list',
          kind: 'waiting_list',
          title: 'Lista de Espera',
          description: 'Inscritos aguardando atribuição',
          count: waitingList.length,
          members: waitingList,
        },
        ...instances.map((instance): TeamBoardColumn => {
          const coordinatorMembers = (coordinatorIdsByTeam.get(instance.id) ?? [])
            .map((userId) => subscriptionByUserId.get(userId))
            .filter((sub): sub is SubscriptionRow => sub !== undefined)
            .map((sub) => toMember(sub, true))
            .sort(comparePeopleByNickname)
          // Sorted within each group rather than across the whole column:
          // coordinators stay pinned above the members they coordinate, which is
          // what the `isCoordinator` flag on the card is for.
          const members = [
            ...coordinatorMembers,
            ...(membersByTeam.get(instance.id) ?? []).sort(comparePeopleByNickname),
          ]
          return {
            id: instance.id,
            kind: 'team',
            title: instance.templateName,
            description: instance.templateDescription ?? undefined,
            count: members.length,
            max: instance.maxCapacity,
            members,
          }
        }),
      ]

      return { columns }
    })
  }

  // Applies a batch of column moves atomically, then returns the refreshed board.
  // Capacity is intentionally not enforced (warn-but-allow lives in the UI).
  async applyAssignments(changes: AssignmentChange[]): Promise<TeamBoard> {
    await this.#withCurrentEvent(async (event) => {
      const instances = await this.#teamInstanceRepository.listTeamInstancesWithDetails(event.id)
      const instanceIds = new Set(instances.map((instance) => instance.id))
      const membershipUserIdsByTeam =
        await this.#teamMembershipRepository.listMemberUserIdsByTeamInstanceIds([...instanceIds])
      const coordinatorIdsByTeam =
        await this.#teamMembershipRepository.listCoordinatorIdsByTeamInstanceIds([...instanceIds])
      const instanceNameById = new Map(
        instances.map((instance) => [instance.id, instance.templateName])
      )

      const currentTeamsByUser = new Map<string, string[]>()
      for (const [teamInstanceId, userIds] of membershipUserIdsByTeam) {
        for (const userId of userIds) {
          const teams = currentTeamsByUser.get(userId) ?? []
          teams.push(teamInstanceId)
          currentTeamsByUser.set(userId, teams)
        }
      }

      // Which team, if any, each user coordinates in this event. A user holds at
      // most one membership per event, so a single team id per user is enough.
      const coordinatedTeamByUser = new Map<string, string>()
      for (const [teamInstanceId, userIds] of coordinatorIdsByTeam) {
        for (const userId of userIds) {
          coordinatedTeamByUser.set(userId, teamInstanceId)
        }
      }

      // Validate every change and resolve subscriptions before touching the DB so
      // a bad change aborts the whole batch cleanly.
      const resolved = await Promise.all(
        changes.map(async (change) => {
          if (change.target.kind === 'team' && !instanceIds.has(change.target.teamInstanceId)) {
            throw new AppError(
              `Team instance ${change.target.teamInstanceId} does not belong to the current event`
            )
          }

          // Coordinator rows are owned by the coordinator drawer, not the board.
          // Moving a coordinator here would either strip the role as a silent side
          // effect of a drag, or leave the coordinator row behind on the old team —
          // a second membership in the same event. Reject and point at the drawer.
          const coordinatedTeamId = coordinatedTeamByUser.get(change.userId)
          if (coordinatedTeamId) {
            const teamName = instanceNameById.get(coordinatedTeamId) ?? coordinatedTeamId
            throw new AppError(
              `User ${change.userId} coordinates ${teamName}. Remove them as coordinator before reassigning.`
            )
          }

          const subscription = await this.#subscriptionRepository.getSubscriptionByUserAndEvent(
            change.userId,
            event.id
          )

          if (!subscription) {
            throw new AppError(
              `No subscription found for user ${change.userId} in the current event`
            )
          }

          return { change, subscription }
        })
      )

      await runInTransaction(async (tx) => {
        for (const { change, subscription } of resolved) {
          // Clear any existing event membership(s) so the move is a clean reassign.
          for (const teamInstanceId of currentTeamsByUser.get(change.userId) ?? []) {
            await this.#teamMembershipRepository.deleteByMemberAndTeam(
              teamInstanceId,
              change.userId,
              tx
            )
          }

          if (change.target.kind === 'team') {
            await this.#teamMembershipRepository.insertTeamMembership(
              {
                userId: change.userId,
                teamInstanceId: change.target.teamInstanceId,
                eventId: event.id,
                type: 'member',
              },
              tx
            )

            // Placing a member into a team means they are "montado" — mark the
            // subscription completed regardless of its prior status.
            await this.#subscriptionRepository.updateSubscriptionStatus(
              subscription.id,
              COMPLETED_STATUS,
              tx
            )
            continue
          }

          if (change.target.kind === 'waiting_list') {
            await this.#subscriptionRepository.updateSubscriptionStatus(
              subscription.id,
              WAITING_LIST_STATUS,
              tx
            )
            continue
          }

          await this.#subscriptionRepository.updateSubscriptionStatus(
            subscription.id,
            UNASSIGNED_STATUS,
            tx
          )
        }

        // Only the people moved *into* a team. Moving someone to the waiting
        // list or back to unassigned deletes their membership and leaves them
        // requestable, so their open requests must survive the move.
        const placedUserIds = resolved
          .filter(({ change }) => change.target.kind === 'team')
          .map(({ change }) => change.userId)

        await this.#memberRequestRepository.outdateOpenRequestsForUsers(
          { eventId: event.id, userIds: placedUserIds },
          tx
        )
      })
    })

    return this.getCurrentEventBoard()
  }

  /**
   * Who may be picked for this team.
   *
   * The rules themselves live in `listTeamCandidates`, which the coordinator's
   * "Solicitar Membros" list also reads — one answer to "who is available in
   * this event", not one per screen.
   */
  async listCandidates(
    teamInstanceId: string,
    role: CandidateRole = 'coordinator'
  ): Promise<CandidateListResult> {
    return this.#withCurrentEvent((event) =>
      listTeamCandidates(
        {
          teamInstanceRepository: this.#teamInstanceRepository,
          teamMembershipRepository: this.#teamMembershipRepository,
          subscriptionRepository: this.#subscriptionRepository,
        },
        { eventId: event.id, teamInstanceId, role }
      )
    )
  }

  /**
   * Adds a batch of members to a single team instance atomically.
   *
   * The write sequence itself lives in `placeMembers`, which approving a member
   * request also calls. One implementation of the membership write path, so the
   * outdating that must follow every placement cannot be forgotten by one of
   * them — see the plan's Phase D.
   *
   * Resolves to the ids of the member requests this placement made
   * unanswerable. `executor` lets a caller run it inside a transaction it
   * already owns.
   */
  async addMembers(
    teamInstanceId: string,
    userIds: string[],
    executor?: DbExecutor
  ): Promise<string[]> {
    return this.#withCurrentEvent((event) =>
      placeMembers(
        {
          teamInstanceRepository: this.#teamInstanceRepository,
          teamMembershipRepository: this.#teamMembershipRepository,
          subscriptionRepository: this.#subscriptionRepository,
          memberRequestRepository: this.#memberRequestRepository,
        },
        { eventId: event.id, teamInstanceId, userIds, executor }
      )
    )
  }

  // Replaces a team instance's coordinators atomically. Coordinators are a flat
  // peer set (no ordering); duplicates are ignored and at most the team template's
  // maxAllowedCoordinators are allowed. Passing an empty array clears all coordinators.
  async assignCoordinators(teamInstanceId: string, coordinatorUserIds: string[]): Promise<void> {
    await this.#withCurrentEvent(async (event) => {
      const instances = await this.#teamInstanceRepository.listTeamInstancesWithDetails(event.id)
      const targetInstance = instances.find((i) => i.id === teamInstanceId)

      if (!targetInstance) {
        throw new AppError(`Team instance ${teamInstanceId} does not belong to the current event`)
      }

      // Dedupe while preserving order, then enforce the template's max.
      const seen = new Set<string>()
      const deduped: string[] = []
      for (const id of coordinatorUserIds) {
        if (!seen.has(id)) {
          seen.add(id)
          deduped.push(id)
        }
      }

      const maxCoordinators = targetInstance.maxAllowedCoordinators
      if (deduped.length > maxCoordinators) {
        throw new AppError(`A team can have at most ${maxCoordinators} coordinators`)
      }

      // A user holds at most one membership per event, so promoting someone who is
      // already a member of any team — or who coordinates a different one — would
      // create a second membership. The target team's own coordinators are exempt:
      // this call replaces them wholesale, so re-picking an existing one is normal.
      const instanceIds = instances.map((instance) => instance.id)
      const instanceNameById = new Map(
        instances.map((instance) => [instance.id, instance.templateName])
      )

      const membershipUserIdsByTeam =
        await this.#teamMembershipRepository.listMemberUserIdsByTeamInstanceIds(instanceIds)
      const memberTeamByUser = new Map<string, string>()
      for (const [tid, userIds] of membershipUserIdsByTeam) {
        for (const userId of userIds) memberTeamByUser.set(userId, tid)
      }

      const coordinatorIdsByTeam =
        await this.#teamMembershipRepository.listCoordinatorIdsByTeamInstanceIds(instanceIds)
      const otherTeamCoordinatedByUser = new Map<string, string>()
      for (const [tid, userIds] of coordinatorIdsByTeam) {
        if (tid === teamInstanceId) continue
        for (const userId of userIds) otherTeamCoordinatedByUser.set(userId, tid)
      }

      // Each userId must have a subscription in the current event. Resolve them
      // up front so a bad entry aborts before we open the transaction.
      const subscriptions = await Promise.all(
        deduped.map(async (userId) => {
          const memberTeamId = memberTeamByUser.get(userId)
          if (memberTeamId) {
            const teamName = instanceNameById.get(memberTeamId) ?? memberTeamId
            throw new AppError(`User ${userId} is already a member of ${teamName}`)
          }

          const coordinatedTeamId = otherTeamCoordinatedByUser.get(userId)
          if (coordinatedTeamId) {
            const teamName = instanceNameById.get(coordinatedTeamId) ?? coordinatedTeamId
            throw new AppError(`User ${userId} already coordinates ${teamName}`)
          }

          const subscription = await this.#subscriptionRepository.getSubscriptionByUserAndEvent(
            userId,
            event.id
          )
          if (!subscription) {
            throw new AppError(`No subscription found for user ${userId} in the current event`)
          }
          return subscription
        })
      )

      // Write the coordinators (as flat `type: 'coordinator'` membership rows) and
      // mark each coordinator's subscription "montado" atomically.
      await runInTransaction(async (tx) => {
        await this.#teamMembershipRepository.setCoordinators(teamInstanceId, event.id, deduped, tx)

        for (const subscription of subscriptions) {
          await this.#subscriptionRepository.updateSubscriptionStatus(
            subscription.id,
            COMPLETED_STATUS,
            tx
          )
        }

        // Promotion grants an event membership too, so a coordinator is just as
        // unrequestable as a member. Same statement, same reason.
        await this.#memberRequestRepository.outdateOpenRequestsForUsers(
          { eventId: event.id, userIds: deduped },
          tx
        )
      })
    })
  }
}
