import { Team } from '../core/Team.ts'
import { teamInstanceRepository } from '../repository/DrizzleTeamInstanceRepository.ts'
import { teamMembershipRepository } from '../repository/DrizzleTeamMembershipRepository.ts'
import { teamTemplateRepository } from '../repository/DrizzleTeamTemplateRepository.ts'

export const teamApp = new Team(
  teamInstanceRepository,
  teamTemplateRepository,
  teamMembershipRepository
)
