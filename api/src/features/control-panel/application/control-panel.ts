import { eventRepository } from '../../event/repository/DrizzleEventRepository.ts'
import { teamInstanceRepository } from '../../team/repository/DrizzleTeamInstanceRepository.ts'
import { teamTemplateRepository } from '../../team/repository/DrizzleTeamTemplateRepository.ts'
import { ControlPanel } from '../core/ControlPanel.ts'

export const controlPanelApp = new ControlPanel(
  teamTemplateRepository,
  eventRepository,
  teamInstanceRepository
)
