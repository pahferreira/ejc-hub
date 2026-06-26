import { AppError } from '../../../shared/AppError.ts'
import { runInTransaction } from '../../../core/database/client.ts'
import type { EventModel } from '../../../core/database/schemas/index.ts'
import type { TeamInstanceRepository } from '../../../modules/team-instance/domain/TeamInstanceRepository.ts'
import type { TeamMembershipRepository } from '../../../modules/team-membership/domain/TeamMembershipRepository.ts'
import type { SubscriptionRepository } from '../../../modules/subscription/domain/SubscriptionRepository.ts'
import type { EventRepository } from '../../../modules/event/domain/EventRepository.ts'
import { formatAreas } from './format-areas.ts'
import {
  UNASSIGNED_STATUS,
  WAITING_LIST_STATUS,
  type AssignmentChange,
  type TeamBoard,
  type TeamBoardColumn,
  type TeamBoardMember,
} from '../domain/board.types.ts'

type SubscriptionRow = Awaited<
  ReturnType<SubscriptionRepository['listSubscriptionsByEventId']>
>[number]

// Falls back to the first word of the full name when the user has no nickname.
function resolveNickname(name: string, nickname: string | null): string {
  return nickname?.trim() || name.trim().split(/\s+/)[0] || name
}

export class TeamBuilding {
  #teamInstanceRepository: TeamInstanceRepository
  #teamMembershipRepository: TeamMembershipRepository
  #subscriptionRepository: SubscriptionRepository
  #eventRepository: EventRepository

  constructor(
    teamInstanceRepo: TeamInstanceRepository,
    teamMembershipRepo: TeamMembershipRepository,
    subscriptionRepo: SubscriptionRepository,
    eventRepo: EventRepository
  ) {
    this.#teamInstanceRepository = teamInstanceRepo
    this.#teamMembershipRepository = teamMembershipRepo
    this.#subscriptionRepository = subscriptionRepo
    this.#eventRepository = eventRepo
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

      // Invert the membership map so we can find each user's team in one lookup.
      const teamByUserId = new Map<string, string>()
      for (const [teamInstanceId, userIds] of membershipUserIdsByTeam) {
        for (const userId of userIds) {
          teamByUserId.set(userId, teamInstanceId)
        }
      }

      const toMember = (subscription: SubscriptionRow): TeamBoardMember => ({
        subscriptionId: subscription.id,
        userId: subscription.userId,
        name: subscription.user.name,
        nickname: resolveNickname(subscription.user.name, subscription.user.nickname),
        phone: subscription.user.phone,
        experienceType: subscription.user.experienceType,
        areas: formatAreas(subscription.user),
        preferences: (subscription.teams ?? [])
          .map((teamInstanceId) => instanceNameById.get(teamInstanceId))
          .filter((name): name is string => Boolean(name)),
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
          const members = membersByTeam.get(instance.id) ?? []
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

      const currentTeamsByUser = new Map<string, string[]>()
      for (const [teamInstanceId, userIds] of membershipUserIdsByTeam) {
        for (const userId of userIds) {
          const teams = currentTeamsByUser.get(userId) ?? []
          teams.push(teamInstanceId)
          currentTeamsByUser.set(userId, teams)
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
              { userId: change.userId, teamInstanceId: change.target.teamInstanceId },
              tx
            )

            if (subscription.status === WAITING_LIST_STATUS) {
              await this.#subscriptionRepository.updateSubscriptionStatus(
                subscription.id,
                UNASSIGNED_STATUS,
                tx
              )
            }
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
      })
    })

    return this.getCurrentEventBoard()
  }
}
