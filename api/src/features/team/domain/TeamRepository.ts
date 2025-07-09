import type {
  TeamInstanceInput,
  TeamInstanceModel,
  TeamTemplateInput,
  TeamTemplateModel,
} from '../../../core/database/schemas/index.ts'
import { TeamInstanceWithTemplate } from './team-repository.types.ts'

export interface TeamRepository {
  insertTeamTemplate: (input: TeamTemplateInput) => Promise<string>
  selectTeamTemplateByKey: (key: string) => Promise<TeamTemplateModel | undefined>
  selectTeamTemplateById: (id: string) => Promise<TeamTemplateModel | undefined>
  listTeamTemplates: () => Promise<TeamTemplateModel[]>
  updateTeamTemplate: (
    id: string,
    input: Partial<TeamTemplateInput>
  ) => Promise<TeamTemplateModel | undefined>
  deleteTeamTemplate: (id: string) => Promise<TeamTemplateModel>
  selectTeamInstance: (id: string) => Promise<TeamInstanceWithTemplate>
  listTeamInstances: (eventId?: string) => Promise<TeamInstanceWithTemplate[]>
  insertTeamInstance: (input: TeamInstanceInput) => Promise<TeamInstanceModel>
  deleteTeamInstance: (id: string) => Promise<TeamInstanceModel>
  selectInstanceByTemplateAndEvent: (
    templateId: string,
    eventId: string
  ) => Promise<TeamInstanceModel>
}
