import { AppError } from '../../../shared/AppError.ts'
import { runInTransaction } from '../../../core/database/client.ts'
import type { EventModel } from '../../../core/database/schemas/index.ts'
import type { TeamInstanceRepository } from '../../../modules/team-instance/domain/TeamInstanceRepository.ts'
import type { TeamMembershipRepository } from '../../../modules/team-membership/domain/TeamMembershipRepository.ts'
import type { SubscriptionRepository } from '../../../modules/subscription/domain/SubscriptionRepository.ts'
import type { EventRepository } from '../../../modules/event/domain/EventRepository.ts'
import { formatAreas } from '../../event/core/format-areas.ts'
import {
  mapSubscriptionToPerson,
  resolveNickname,
} from '../../event/core/subscription-to-person.ts'
import {
  COMPLETED_STATUS,
  UNASSIGNED_STATUS,
  WAITING_LIST_STATUS,
  type AssignmentChange,
  type Candidate,
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
          const members = [...coordinatorMembers, ...(membersByTeam.get(instance.id) ?? [])]
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
      })
    })

    return this.getCurrentEventBoard()
  }

  // Returns the list of users who subscribed to the event and are not assigned to a team.
  // `role` distinguishes the two callers of this endpoint: 'coordinator' keeps the target
  // team's own coordinators in the list (the coordinator drawer shows/re-picks them),
  // while 'member' excludes them so a coordinator can't also be added as a plain member.
  async listCandidates(
    teamInstanceId: string,
    role: CandidateRole = 'coordinator'
  ): Promise<CandidateListResult> {
    return this.#withCurrentEvent(async (event) => {
      const instances = await this.#teamInstanceRepository.listTeamInstancesWithDetails(event.id)
      const instanceIds = new Set(instances.map((i) => i.id))

      const targetInstance = instances.find((i) => i.id === teamInstanceId)

      if (!targetInstance) {
        throw new AppError(`Team instance ${teamInstanceId} does not belong to the current event`)
      }

      // Build member exclusion set — everyone who has a team membership in the event.
      const membershipUserIdsByTeam =
        await this.#teamMembershipRepository.listMemberUserIdsByTeamInstanceIds([...instanceIds])
      const memberExclusionSet = new Set<string>()
      for (const [, userIds] of membershipUserIdsByTeam) {
        for (const userId of userIds) {
          memberExclusionSet.add(userId)
        }
      }

      // Build coordinator exclusion set from OTHER teams only, and capture the
      // target team's own coordinator IDs for force-include.
      const coordinatorIdsByTeam =
        await this.#teamMembershipRepository.listCoordinatorIdsByTeamInstanceIds([...instanceIds])
      const otherTeamCoordinatorSet = new Set<string>()
      const targetCoordinatorSet = new Set<string>()
      for (const [tid, coordIds] of coordinatorIdsByTeam) {
        if (tid === teamInstanceId) {
          for (const id of coordIds) targetCoordinatorSet.add(id)
        } else {
          for (const id of coordIds) otherTeamCoordinatorSet.add(id)
        }
      }

      const subscriptions = await this.#subscriptionRepository.listSubscriptionsByEventId(event.id)
      const instanceNameById = new Map(instances.map((i) => [i.id, i.templateName]))

      const eligibleSubscriptions = subscriptions.filter((sub) => {
        if (sub.status === 'cancelled') return false
        // The target team's own current coordinators: kept for coordinator assignment
        // (so the drawer can show/re-pick them), excluded for member assignment (they
        // already occupy the (team, user) row and must not be added as a member too).
        if (targetCoordinatorSet.has(sub.userId)) return role === 'coordinator'
        // Exclude members of any team.
        if (memberExclusionSet.has(sub.userId)) return false
        // Exclude coordinators of other teams.
        if (otherTeamCoordinatorSet.has(sub.userId)) return false
        return true
      })

      // Resolve prior coordinator experience (teams coordinated in other events)
      // for the eligible candidates only.
      const coordinatorExperienceByUser =
        await this.#teamMembershipRepository.listCoordinatorExperienceByUserIds(
          eligibleSubscriptions.map((sub) => sub.userId),
          event.id
        )

      const candidates: Candidate[] = eligibleSubscriptions
        .map((sub) => {
          const experienceTeams = coordinatorExperienceByUser.get(sub.userId) ?? []
          return {
            userId: sub.userId,
            name: sub.user.name,
            nickname: resolveNickname(sub.user.name, sub.user.nickname),
            pictureUrl: sub.user.pictureUrl,
            experienceType: sub.user.experienceType,
            circleKey: sub.user.circle?.key ?? null,
            areas: formatAreas(sub.user),
            details: sub.details ?? '',
            preferenceTeamIds: sub.teams ?? [],
            preferences: (sub.teams ?? [])
              .map((tid) => instanceNameById.get(tid))
              .filter((name): name is string => Boolean(name)),
            // Self-declared flag OR at least one recorded past coordination.
            hasCoordinatorExperience:
              sub.user.hasCoordinatorExperience || experienceTeams.length > 0,
            coordinatorExperienceTeams: experienceTeams,
            weekAvailability: sub.availability ?? [],
          }
        })
        .sort((a, b) => a.nickname.localeCompare(b.nickname, 'pt-BR', { sensitivity: 'base' }))

      const currentCoordinators =
        await this.#teamMembershipRepository.getCoordinatorUserIds(teamInstanceId)

      return {
        team: {
          id: targetInstance.id,
          name: targetInstance.templateName,
          maxAllowedCoordinators: targetInstance.maxAllowedCoordinators,
        },
        currentCoordinators,
        candidates,
      }
    })
  }

  // Adds a batch of members to a single team instance atomically. All-or-nothing:
  // if any candidate is invalid (already on a team, or missing a subscription) the
  // whole batch aborts before the DB is touched. Capacity is intentionally not
  // enforced here — matching applyAssignments, the UI owns the "vagas" guardrail.
  async addMembers(teamInstanceId: string, userIds: string[]): Promise<void> {
    await this.#withCurrentEvent(async (event) => {
      const instances = await this.#teamInstanceRepository.listTeamInstancesWithDetails(event.id)
      const instanceIds = new Set(instances.map((i) => i.id))

      if (!instanceIds.has(teamInstanceId)) {
        throw new AppError(`Team instance ${teamInstanceId} does not belong to the current event`)
      }

      // Dedupe while preserving order.
      const seen = new Set<string>()
      const deduped: string[] = []
      for (const id of userIds) {
        if (!seen.has(id)) {
          seen.add(id)
          deduped.push(id)
        }
      }

      if (deduped.length === 0) {
        throw new AppError('At least one member is required')
      }

      // Anyone with a membership in the event is already assigned and cannot be added.
      const membershipUserIdsByTeam =
        await this.#teamMembershipRepository.listMemberUserIdsByTeamInstanceIds([...instanceIds])
      const assignedUserSet = new Set<string>()
      for (const [, ids] of membershipUserIdsByTeam) {
        for (const id of ids) assignedUserSet.add(id)
      }

      // Coordinators of *any* team in the event already hold a membership, so adding
      // them as a member would be a second membership in the same event — not just a
      // clash on the target team's (team, user) row.
      const coordinatorIdsByTeam =
        await this.#teamMembershipRepository.listCoordinatorIdsByTeamInstanceIds([...instanceIds])
      const coordinatorUserSet = new Set<string>()
      for (const [, ids] of coordinatorIdsByTeam) {
        for (const id of ids) coordinatorUserSet.add(id)
      }

      // Validate and resolve subscriptions up front so a bad entry aborts the whole
      // batch cleanly before opening the transaction.
      const resolved = await Promise.all(
        deduped.map(async (userId) => {
          if (assignedUserSet.has(userId)) {
            throw new AppError(`User ${userId} is already assigned to a team`)
          }

          if (coordinatorUserSet.has(userId)) {
            throw new AppError(`User ${userId} already coordinates a team in this event`)
          }

          const subscription = await this.#subscriptionRepository.getSubscriptionByUserAndEvent(
            userId,
            event.id
          )

          if (!subscription) {
            throw new AppError(`No subscription found for user ${userId} in the current event`)
          }

          return { userId, subscription }
        })
      )

      await runInTransaction(async (tx) => {
        for (const { userId, subscription } of resolved) {
          await this.#teamMembershipRepository.insertTeamMembership(
            { userId, teamInstanceId, type: 'member' },
            tx
          )

          // Adding a member to a team means they are "montado" — mark the
          // subscription completed regardless of its prior status.
          await this.#subscriptionRepository.updateSubscriptionStatus(
            subscription.id,
            COMPLETED_STATUS,
            tx
          )
        }
      })
    })
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
        await this.#teamMembershipRepository.setCoordinators(teamInstanceId, deduped, tx)

        for (const subscription of subscriptions) {
          await this.#subscriptionRepository.updateSubscriptionStatus(
            subscription.id,
            COMPLETED_STATUS,
            tx
          )
        }
      })
    })
  }
}
