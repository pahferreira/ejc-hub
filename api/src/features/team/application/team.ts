import { eventRepository } from '../../event/repository/DrizzleEventRepository.ts'
import { userRepository } from '../../user/repository/DrizzleUserRepository.ts'
import { TeamInstance } from '../core/TeamInstance.ts'
import { TeamMembership } from '../core/TeamMembership.ts'
import { TeamTemplate } from '../core/TeamTemplate.ts'
import { teamRepository } from '../repository/DrizzleTeamRepository.ts'

export const teamTemplateApp = new TeamTemplate(teamRepository)
export const teamInstanceApp = new TeamInstance(teamRepository, eventRepository)
export const teamMembershipApp = new TeamMembership(userRepository, teamRepository)
