import { TeamTemplate } from '../core/TeamTemplate.ts'
import { teamRepository } from '../repository/DrizzleTeamRepository.ts'

export const teamTemplateApp = new TeamTemplate(teamRepository)
