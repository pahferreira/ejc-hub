import type {
  CreateTeamTemplateInput,
  TeamTemplate,
} from './team-templates.types.ts'

export interface TeamRepository {
  insertTeamTemplate: (input: CreateTeamTemplateInput) => Promise<string>
  getTeamTemplateByKey: (key: string) => Promise<TeamTemplate | undefined>
}
