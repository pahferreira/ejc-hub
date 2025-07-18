import type { TeamInstanceInput, TeamInstanceModel } from '../../../core/database/schemas/index.ts'
import { TeamInstanceWithTemplate } from './team-instance.types.ts'

export interface TeamInstanceRepository {
  selectTeamInstance: (id: string) => Promise<TeamInstanceWithTemplate>
  listTeamInstances: (eventId?: string) => Promise<TeamInstanceWithTemplate[]>
  insertTeamInstance: (input: TeamInstanceInput) => Promise<TeamInstanceModel>
  deleteTeamInstance: (id: string) => Promise<TeamInstanceModel>
  updateTeamInstance: (id: string, input: Partial<TeamInstanceInput>) => Promise<TeamInstanceModel>
}
