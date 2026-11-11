import { AppError } from '../../../shared/AppError.ts'
import { runInTransaction, type DbExecutor } from '../../../core/database/client.ts'
import type { TeamInstanceRepository } from '../../../modules/team-instance/domain/TeamInstanceRepository.ts'
import type { TeamMembershipRepository } from '../../../modules/team-membership/domain/TeamMembershipRepository.ts'
import type { SubscriptionRepository } from '../../../modules/subscription/domain/SubscriptionRepository.ts'
import type { MemberRequestRepository } from '../../../modules/member-request/domain/MemberRequestRepository.ts'
import { formatAreas } from '../../event/helpers/format-areas.ts'
import { comparePeopleByNickname } from '../../../shared/compare-people-by-nickname.ts'
import { resolveNickname } from '../../../shared/resolve-nickname.ts'
import {
  COMPLETED_STATUS,
  type Candidate,
  type CandidateListResult,
  type CandidateRole,
} from '../domain/board.types.ts'

export type ListCandidatesInput = {
  /** The current event, already resolved by the caller. */
  eventId: string
  teamInstanceId: string
  role: CandidateRole
}

export type PlaceInput = {
  /** The current event, already resolved by the caller. */
  eventId: string
  teamInstanceId: string
  userIds: string[]
  /**
   * A transaction to join, when the caller already owns one.
   *
   * Without it this opens its own. Calling it from inside another transaction
   * *without* passing the handle would take a **second** connection and a second
   * top-level transaction rather than joining the first: not atomic with the
   * caller's writes, and able to deadlock against a row the outer transaction
   * already locked. Composing here rather than widening `runInTransaction` keeps
   * that shared infra alone and matches the `executor?: DbExecutor` seam every
   * repository write already has.
   */
  executor?: DbExecutor
}

/**
 * Who may be placed on a team, and placing them.
 *
 * The *one* home of the eligibility rules and of the membership write path. The
 * team-building board and an approved member request both go through it, so it
 * cannot belong to either feature's wired singleton without the other importing
 * that singleton: each feature's `application/` builds its own instance from the
 * same repositories and hands it to its core class.
 */
export class TeamPlacement {
  #teamInstanceRepository: TeamInstanceRepository
  #teamMembershipRepository: TeamMembershipRepository
  #subscriptionRepository: SubscriptionRepository
  #memberRequestRepository: MemberRequestRepository

  constructor(
    teamInstanceRepo: TeamInstanceRepository,
    teamMembershipRepo: TeamMembershipRepository,
    subscriptionRepo: SubscriptionRepository,
    memberRequestRepo: MemberRequestRepository
  ) {
    this.#teamInstanceRepository = teamInstanceRepo
    this.#teamMembershipRepository = teamMembershipRepo
    this.#subscriptionRepository = subscriptionRepo
    this.#memberRequestRepository = memberRequestRepo
  }

  /**
   * Who may be picked for a team, and why everyone else is out.
   *
   * Coordinator assignment, member assignment and the coordinator-facing
   * "Solicitar Membros" list all read this, so "who is available in this event"
   * is answered once — a second copy is how two screens come to disagree about
   * whether someone is free.
   *
   * `role` distinguishes the callers: `'coordinator'` keeps the target team's own
   * coordinators in the list (the coordinator drawer shows and re-picks them),
   * while `'member'` excludes them so a coordinator cannot also be added as a
   * plain member.
   */
  async listCandidates(input: ListCandidatesInput): Promise<CandidateListResult> {
    const { eventId, teamInstanceId, role } = input

    const instances = await this.#teamInstanceRepository.listTeamInstancesWithDetails(eventId)
    const instanceIds = new Set(instances.map((instance) => instance.id))

    const targetInstance = instances.find((instance) => instance.id === teamInstanceId)

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

    const subscriptions = await this.#subscriptionRepository.listSubscriptionsByEventId(eventId)
    const instanceNameById = new Map(
      instances.map((instance) => [instance.id, instance.templateName])
    )

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
        eventId
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
          hasCoordinatorExperience: sub.user.hasCoordinatorExperience || experienceTeams.length > 0,
          coordinatorExperienceTeams: experienceTeams,
          weekAvailability: sub.availability ?? [],
        }
      })
      .sort(comparePeopleByNickname)

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
  }

  /**
   * Places a batch of members into a single team instance atomically.
   *
   * All-or-nothing: if any candidate is invalid (already on a team, or missing a
   * subscription) the whole batch aborts before the DB is touched. Capacity is
   * intentionally not enforced — matching `applyAssignments`, the UI owns the
   * "vagas" guardrail.
   *
   * Validate-then-write throughout: every read, check and throw happens above the
   * transaction, whose body is writes only, sequentially.
   *
   * Resolves to the ids of the member requests this placement made unanswerable —
   * what an approval reports to the client as `supersededRequestIds`. Anyone
   * holding a membership in the event cannot be requested by anybody, so the
   * outdating belongs *here*, with the insert, rather than at each call site where
   * one of them would eventually forget it.
   */
  async place(input: PlaceInput): Promise<string[]> {
    const { eventId, teamInstanceId, userIds, executor } = input

    const instances = await this.#teamInstanceRepository.listTeamInstancesWithDetails(eventId)
    const instanceIds = new Set(instances.map((instance) => instance.id))

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
          eventId
        )

        if (!subscription) {
          throw new AppError(`No subscription found for user ${userId} in the current event`)
        }

        return { userId, subscription }
      })
    )

    // Writes only — every read, validation and throw happened above, so this body
    // is safe to run inside a transaction the caller already owns.
    const write = async (tx: DbExecutor) => {
      for (const { userId, subscription } of resolved) {
        await this.#teamMembershipRepository.insertTeamMembership(
          { userId, teamInstanceId, eventId, type: 'member' },
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

      // After the loop, one set-based statement rather than one per member:
      // holding a membership in the event is what makes every other open request
      // for these people unanswerable, whichever team asked.
      return this.#memberRequestRepository.outdateOpenRequestsForUsers(
        { eventId, userIds: deduped },
        tx
      )
    }

    return executor ? write(executor) : runInTransaction(write)
  }
}
