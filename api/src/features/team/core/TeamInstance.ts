import { AppError } from '../../../shared/AppError.ts'
import type { EventRepository } from '../../event/domain/EventRepository.ts'
import type { TeamRepository } from '../domain/TeamRepository.ts'

export class TeamInstance {
  #teamRepository: TeamRepository
  #eventRepository: EventRepository

  constructor(teamRepo: TeamRepository, eventRepo: EventRepository) {
    this.#teamRepository = teamRepo
    this.#eventRepository = eventRepo
  }

  async createTeamInstance(templateKey: string, eventId: string) {
    const event = await this.#eventRepository.findEvent(eventId)

    if (!event) {
      throw new AppError("Event doesn't exist")
    }

    const template = await this.#teamRepository.selectTeamTemplateByKey(templateKey)

    if (!template) {
      throw new AppError("Team Template doesn't exist")
    }

    const result = await this.#teamRepository.insertTeamInstance({
      templateId: template.id,
      eventId,
    })

    return result
  }
}
