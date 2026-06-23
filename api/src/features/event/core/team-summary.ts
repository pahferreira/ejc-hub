export type TeamSummaryBucket = 'completed' | 'partiallyCompleted' | 'inRisk'

/**
 * Roll-up bucket used by the Equipes overview summary. Boundary at 50% (inRisk).
 * A team with no configured capacity, or filled below 50%, is "in risk"; a full
 * team is "completed"; everything in between is "partially completed".
 * `memberCount` is the distinct number of people on the team, coordinators
 * included.
 */
export function getTeamSummaryBucket(memberCount: number, maxCapacity: number): TeamSummaryBucket {
  if (maxCapacity <= 0) {
    return 'inRisk'
  }
  if (memberCount >= maxCapacity) {
    return 'completed'
  }
  const ratio = memberCount / maxCapacity
  if (ratio < 0.5) {
    return 'inRisk'
  }
  return 'partiallyCompleted'
}
