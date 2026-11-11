import type { AssignedTeamForUser } from '../../../modules/team-instance/domain/TeamInstanceRepository.ts'
import type { TeamCoordinator } from '../../../modules/team-membership/domain/TeamMembershipRepository.ts'

/**
 * How the caller belongs to the team they were placed on, or null when they
 * have no team in the event.
 *
 * Derived from the coordinator list already loaded for `assignedTeam` rather
 * than from a second membership read: that list is exactly the team's
 * `team_memberships` rows of type `coordinator`, so being absent from it while
 * holding a team is what `member` means.
 *
 * Clients use it to decide whether the coordinator-only screens exist for this
 * person. It is a visibility signal, never an authorization one — every write
 * re-derives the caller's membership server-side.
 */
export function toMyMembershipType(
  team: AssignedTeamForUser | undefined,
  coordinators: TeamCoordinator[],
  userId: string
): 'member' | 'coordinator' | null {
  if (!team) {
    return null
  }

  return coordinators.some((coordinator) => coordinator.id === userId) ? 'coordinator' : 'member'
}
