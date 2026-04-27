import { Team } from '../core/Team.ts'
import { teamInstanceRepository } from '../../../modules/team-instance/repository/DrizzleTeamInstanceRepository.ts'
import { teamMembershipRepository } from '../../../modules/team-membership/repository/DrizzleTeamMembershipRepository.ts'
import { teamTemplateRepository } from '../../../modules/team-template/repository/DrizzleTeamTemplateRepository.ts'

export const teamApp = new Team(
  teamInstanceRepository,
  teamTemplateRepository,
  teamMembershipRepository
)
