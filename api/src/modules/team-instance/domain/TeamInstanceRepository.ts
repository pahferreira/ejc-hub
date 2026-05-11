import type { TeamInstanceInput, TeamInstanceModel } from '../../../core/database/schemas/index.ts'

export type AssignedTeamForUser = {
  id: string
  name: string
  description: string | null
}

export type TeamCoordinator = {
  id: string
  name: string
  phone: string | null
}

export interface TeamInstanceRepository {
  selectTeamInstance: (id: string) => Promise<{
    id: string
    description?: string | null
    eventId: string
    name: string
    templateKey: string
  }>
  listTeamInstances: (
    eventId?: string,
    queryParams?: { keys?: string[] }
  ) => Promise<
    {
      id: string
      eventId: string
      name: string
      templateKey: string
    }[]
  >
  findUserTeamForEvent: (
    userId: string,
    eventId: string
  ) => Promise<AssignedTeamForUser | undefined>
  listTeamCoordinators: (teamInstanceId: string) => Promise<TeamCoordinator[]>
  insertTeamInstance: (input: TeamInstanceInput) => Promise<TeamInstanceModel>
  deleteTeamInstance: (id: string) => Promise<TeamInstanceModel>
  updateTeamInstance: (id: string, input: Partial<TeamInstanceInput>) => Promise<TeamInstanceModel>
  bulkInsertTeamInstances: (eventId: string, templateIds: string[]) => Promise<TeamInstanceModel[]>
}
