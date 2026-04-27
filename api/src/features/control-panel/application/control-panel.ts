import { eventRepository } from '../../../modules/event/repository/DrizzleEventRepository.ts'
import { teamInstanceRepository } from '../../../modules/team-instance/repository/DrizzleTeamInstanceRepository.ts'
import { teamTemplateRepository } from '../../../modules/team-template/repository/DrizzleTeamTemplateRepository.ts'
import { ControlPanel } from '../core/ControlPanel.ts'

export const controlPanelApp = new ControlPanel(
  teamTemplateRepository,
  eventRepository,
  teamInstanceRepository
)
