import { eventRepository } from '../../event/repository/DrizzleEventRepository.ts'
import { TeamInstance } from '../core/TeamInstance.ts'
import { TeamTemplate } from '../core/TeamTemplate.ts'
import { teamRepository } from '../repository/DrizzleTeamRepository.ts'

export const teamTemplateApp = new TeamTemplate(teamRepository)
export const teamInstanceApp = new TeamInstance(teamRepository, eventRepository)
