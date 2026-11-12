/**
 * Who already holds a membership in the event, by user.
 *
 * Every rule that places someone starts from the same two reads (members per
 * team, coordinators per team) and asks the same questions of them: is this
 * person on a team, and do they coordinate one. The core class does the reads;
 * this turns the per-team maps into per-user lookups.
 */
export type EventOccupancy = {
  /** The teams each user is a plain member of. One at most, by the event's unique membership. */
  memberTeamsByUser: Map<string, string[]>
  /** The team each user coordinates. A single id is enough: one membership per user per event. */
  coordinatedTeamByUser: Map<string, string>
}

export function toEventOccupancy(
  memberUserIdsByTeam: Map<string, string[]>,
  coordinatorIdsByTeam: Map<string, string[]>
): EventOccupancy {
  const memberTeamsByUser = new Map<string, string[]>()
  for (const [teamInstanceId, userIds] of memberUserIdsByTeam) {
    for (const userId of userIds) {
      const teams = memberTeamsByUser.get(userId) ?? []
      teams.push(teamInstanceId)
      memberTeamsByUser.set(userId, teams)
    }
  }

  const coordinatedTeamByUser = new Map<string, string>()
  for (const [teamInstanceId, userIds] of coordinatorIdsByTeam) {
    for (const userId of userIds) {
      coordinatedTeamByUser.set(userId, teamInstanceId)
    }
  }

  return { memberTeamsByUser, coordinatedTeamByUser }
}
