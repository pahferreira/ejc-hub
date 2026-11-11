import { AppError } from '../../../shared/AppError.ts'
import { runInTransaction, type DbExecutor } from '../../../core/database/client.ts'
import type { TeamInstanceRepository } from '../../../modules/team-instance/domain/TeamInstanceRepository.ts'
import type { TeamMembershipRepository } from '../../../modules/team-membership/domain/TeamMembershipRepository.ts'
import type { SubscriptionRepository } from '../../../modules/subscription/domain/SubscriptionRepository.ts'
import type { MemberRequestRepository } from '../../../modules/member-request/domain/MemberRequestRepository.ts'
import { COMPLETED_STATUS } from '../domain/board.types.ts'

/**
 * The repositories placing a member touches.
 *
 * Passed in rather than reached for. This is the *one* implementation of the
 * membership write path, and both the team-building board and an approved
 * member request go through it — so it cannot belong to either feature's wired
 * singleton without the other importing that singleton.
 */
export type PlaceMembersDeps = {
  teamInstanceRepository: TeamInstanceRepository
  teamMembershipRepository: TeamMembershipRepository
  subscriptionRepository: SubscriptionRepository
  memberRequestRepository: MemberRequestRepository
}

export type PlaceMembersInput = {
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
export async function placeMembers(
  deps: PlaceMembersDeps,
  input: PlaceMembersInput
): Promise<string[]> {
  const { eventId, teamInstanceId, userIds, executor } = input

  const instances = await deps.teamInstanceRepository.listTeamInstancesWithDetails(eventId)
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
    await deps.teamMembershipRepository.listMemberUserIdsByTeamInstanceIds([...instanceIds])
  const assignedUserSet = new Set<string>()
  for (const [, ids] of membershipUserIdsByTeam) {
    for (const id of ids) assignedUserSet.add(id)
  }

  // Coordinators of *any* team in the event already hold a membership, so adding
  // them as a member would be a second membership in the same event — not just a
  // clash on the target team's (team, user) row.
  const coordinatorIdsByTeam =
    await deps.teamMembershipRepository.listCoordinatorIdsByTeamInstanceIds([...instanceIds])
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

      const subscription = await deps.subscriptionRepository.getSubscriptionByUserAndEvent(
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
  const place = async (tx: DbExecutor) => {
    for (const { userId, subscription } of resolved) {
      await deps.teamMembershipRepository.insertTeamMembership(
        { userId, teamInstanceId, eventId, type: 'member' },
        tx
      )

      // Adding a member to a team means they are "montado" — mark the
      // subscription completed regardless of its prior status.
      await deps.subscriptionRepository.updateSubscriptionStatus(
        subscription.id,
        COMPLETED_STATUS,
        tx
      )
    }

    // After the loop, one set-based statement rather than one per member:
    // holding a membership in the event is what makes every other open request
    // for these people unanswerable, whichever team asked.
    return deps.memberRequestRepository.outdateOpenRequestsForUsers(
      { eventId, userIds: deduped },
      tx
    )
  }

  return executor ? place(executor) : runInTransaction(place)
}
