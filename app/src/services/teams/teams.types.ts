export const teamOptionsQueryKeys = {
  all: ['team-options'] as const,
}

export type TeamOption = {
  key: string
  name: string
  description: string
}

export type TeamStatus = 'needsMembers' | 'spotsAvailable' | 'complete'

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
