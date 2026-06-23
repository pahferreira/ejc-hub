export type TeamStatus = 'needsMembers' | 'spotsAvailable' | 'complete'

export const teamOptionsQueryKeys = {
  all: ['team-options'] as const,
}

export type TeamsListFilters = {
  name?: string
  status?: Extract<TeamStatus, 'needsMembers' | 'complete'>
}

export const teamsOverviewQueryKeys = {
  stats: ['teams', 'overview', 'stats'] as const,
  list: (filters: TeamsListFilters = {}) => ['teams', 'overview', 'list', filters] as const,
}

export type TeamOption = {
  key: string
  name: string
  description: string
}

export type TeamCoordinatorSummary = {
  id: string
  name: string
}

export type TeamOverview = {
  id: string
  templateKey: string
  templateName: string
  templateDescription: string | null
  memberCount: number
  maxCapacity: number
  coordinators: TeamCoordinatorSummary[]
}

export type TeamsOverviewStats = {
  completed: number
  partiallyCompleted: number
  inRisk: number
  total: number
}
