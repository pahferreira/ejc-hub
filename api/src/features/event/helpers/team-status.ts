export type TeamStatus = 'needsMembers' | 'spotsAvailable' | 'complete'

/**
 * Per-team health status. Boundary at 80% (spotsAvailable). Mirrors the
 * frontend's TeamHealthCard status so filtering by status stays consistent.
 * `memberCount` is the distinct number of people on the team, coordinators
 * included.
 */
export function getTeamStatus(memberCount: number, maxCapacity: number): TeamStatus {
  if (maxCapacity <= 0) {
    return 'needsMembers'
  }
  const ratio = memberCount / maxCapacity
  if (ratio >= 1) {
    return 'complete'
  }
  if (ratio >= 0.8) {
    return 'spotsAvailable'
  }
  return 'needsMembers'
}
