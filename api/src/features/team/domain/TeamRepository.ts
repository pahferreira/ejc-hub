import {
  TeamTemplateInput,
  TeamTemplateModel,
} from '../../../core/database/schemas/index.ts'

export interface TeamRepository {
  insertTeamTemplate: (input: TeamTemplateInput) => Promise<string>
  getTeamTemplateByKey: (key: string) => Promise<TeamTemplateModel | undefined>
}
