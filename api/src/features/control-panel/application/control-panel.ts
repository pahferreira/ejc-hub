import { teamTemplateRepository } from '../../team/repository/DrizzleTeamTemplateRepository.ts'
import { ControlPanel } from '../core/ControlPanel.ts'

export const controlPanelApp = new ControlPanel(teamTemplateRepository)
