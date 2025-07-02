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

  async #checkTeamInstanceExists(templateId: string, eventId: string) {
    const templateInstance = await this.#teamRepository.selectInstanceByTemplateAndEvent(
      templateId,
      eventId
    )

    return templateInstance ? true : false
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

    const isInstanceAlreadyCreated = await this.#checkTeamInstanceExists(template.id, eventId)

    if (isInstanceAlreadyCreated) {
      throw new AppError(
        `A team instance already exists with "${templateKey}" template key for the event`
      )
    }

    const result = await this.#teamRepository.insertTeamInstance({
      templateId: template.id,
      eventId,
    })

    return result
  }

  async listTeamInstances() {
    const teamInstancesWithTemplate = await this.#teamRepository.listTeamInstances()
    return teamInstancesWithTemplate
  }

  async getTeamInstance(id: string) {
    const detailedTeamInstance = await this.#teamRepository.selectTeamInstance(id)
    return detailedTeamInstance
  }

  async deleteTeamInstance(id: string) {
    const deleted = await this.#teamRepository.deleteTeamInstance(id)
    return deleted
  }
}
