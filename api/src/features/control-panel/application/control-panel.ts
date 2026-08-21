import { circleRepository } from '../../../modules/circle/repository/DrizzleCircleRepository.ts'
import { eventRepository } from '../../../modules/event/repository/DrizzleEventRepository.ts'
import { teamInstanceRepository } from '../../../modules/team-instance/repository/DrizzleTeamInstanceRepository.ts'
import { teamMembershipRepository } from '../../../modules/team-membership/repository/DrizzleTeamMembershipRepository.ts'
import { teamTemplateRepository } from '../../../modules/team-template/repository/DrizzleTeamTemplateRepository.ts'
import { ControlPanel } from '../core/ControlPanel.ts'
import { CallCampaignService } from '../services/call-campaign/CallCampaignService.ts'

const callCampaignService = new CallCampaignService(teamMembershipRepository, eventRepository)

export const controlPanelApp = new ControlPanel(
  teamTemplateRepository,
  eventRepository,
  teamInstanceRepository,
  circleRepository,
  callCampaignService
)
