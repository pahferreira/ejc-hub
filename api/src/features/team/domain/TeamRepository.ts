import type { TeamTemplateInput, TeamTemplateModel } from '../../../core/database/schemas/index.ts'

export interface TeamRepository {
  insertTeamTemplate: (input: TeamTemplateInput) => Promise<string>
  selectTeamTemplateByKey: (key: string) => Promise<TeamTemplateModel | undefined>
  selectTeamTemplateById: (id: string) => Promise<TeamTemplateModel | undefined>
  listTeamTemplates: () => Promise<TeamTemplateModel[]>
  updateTeamTemplate: (
    id: string,
    input: Partial<TeamTemplateInput>
  ) => Promise<TeamTemplateModel | undefined>
}
