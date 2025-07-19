import { Events } from '../core/Events.ts'
import { eventRepository } from '../repository/DrizzleEventRepository.ts'
import { teamTemplateRepository } from '../../team/repository/DrizzleTeamTemplateRepository.ts'
import { teamInstanceRepository } from '../../team/repository/DrizzleTeamInstanceRepository.ts'

export const eventsApp = new Events(eventRepository, teamTemplateRepository, teamInstanceRepository)
