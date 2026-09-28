import { AppError } from '../../../shared/AppError.ts'
import type { TeamInstanceRepository } from '../../../modules/team-instance/domain/TeamInstanceRepository.ts'
import type { TeamMembershipRepository } from '../../../modules/team-membership/domain/TeamMembershipRepository.ts'
import type { SubscriptionRepository } from '../../../modules/subscription/domain/SubscriptionRepository.ts'
import { formatAreas } from '../../event/core/format-areas.ts'
import { resolveNickname } from '../../../shared/resolve-nickname.ts'
import type { Candidate, CandidateListResult, CandidateRole } from '../domain/board.types.ts'

/** The repositories the eligibility rules read. Passed in, never reached for. */
export type ListTeamCandidatesDeps = {
  teamInstanceRepository: TeamInstanceRepository
  teamMembershipRepository: TeamMembershipRepository
  subscriptionRepository: SubscriptionRepository
}

export type ListTeamCandidatesInput = {
  /** The current event, already resolved by the caller. */
  eventId: string
  teamInstanceId: string
  role: CandidateRole
}

/**
 * Who may be picked for a team, and why everyone else is out.
 *
 * The *one* place the eligibility rules live. Coordinator assignment, member
 * assignment and the coordinator-facing "Solicitar Membros" list all read this,
 * so "who is available in this event" is answered once — a second copy is how
 * two screens come to disagree about whether someone is free.
 *
 * `role` distinguishes the callers: `'coordinator'` keeps the target team's own
 * coordinators in the list (the coordinator drawer shows and re-picks them),
 * while `'member'` excludes them so a coordinator cannot also be added as a
 * plain member.
 */
export async function listTeamCandidates(
  deps: ListTeamCandidatesDeps,
  input: ListTeamCandidatesInput
): Promise<CandidateListResult> {
  const { eventId, teamInstanceId, role } = input

  const instances = await deps.teamInstanceRepository.listTeamInstancesWithDetails(eventId)
  const instanceIds = new Set(instances.map((instance) => instance.id))

  const targetInstance = instances.find((instance) => instance.id === teamInstanceId)

  if (!targetInstance) {
    throw new AppError(`Team instance ${teamInstanceId} does not belong to the current event`)
  }

  // Build member exclusion set — everyone who has a team membership in the event.
  const membershipUserIdsByTeam =
    await deps.teamMembershipRepository.listMemberUserIdsByTeamInstanceIds([...instanceIds])
  const memberExclusionSet = new Set<string>()
  for (const [, userIds] of membershipUserIdsByTeam) {
    for (const userId of userIds) {
      memberExclusionSet.add(userId)
    }
  }

  // Build coordinator exclusion set from OTHER teams only, and capture the
  // target team's own coordinator IDs for force-include.
  const coordinatorIdsByTeam =
    await deps.teamMembershipRepository.listCoordinatorIdsByTeamInstanceIds([...instanceIds])
  const otherTeamCoordinatorSet = new Set<string>()
  const targetCoordinatorSet = new Set<string>()
  for (const [tid, coordIds] of coordinatorIdsByTeam) {
    if (tid === teamInstanceId) {
      for (const id of coordIds) targetCoordinatorSet.add(id)
    } else {
      for (const id of coordIds) otherTeamCoordinatorSet.add(id)
    }
  }

  const subscriptions = await deps.subscriptionRepository.listSubscriptionsByEventId(eventId)
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
    await deps.teamMembershipRepository.listCoordinatorExperienceByUserIds(
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
    .sort((a, b) => a.nickname.localeCompare(b.nickname, 'pt-BR', { sensitivity: 'base' }))

  const currentCoordinators =
    await deps.teamMembershipRepository.getCoordinatorUserIds(teamInstanceId)

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
