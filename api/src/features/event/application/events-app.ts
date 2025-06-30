import { Events } from '../core/Events.ts'
import { eventRepository } from '../repository/DrizzleEventRepository.ts'

export const eventsApp = new Events(eventRepository)
