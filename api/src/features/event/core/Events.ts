import { AppError } from '../../../shared/AppError.ts'
import type { EventRepository } from '../domain/EventRepository.ts'
import type { TeamTemplateRepository } from '../../team/domain/TeamTemplateRepository.ts'
import type { TeamInstanceRepository } from '../../team/domain/TeamInstanceRepository.ts'

export class Events {
  #eventRepository: EventRepository
  #teamTemplateRepository: TeamTemplateRepository
  #teamInstanceRepository: TeamInstanceRepository

  constructor(
    eventRepo: EventRepository,
    teamTemplateRepo: TeamTemplateRepository,
    teamInstanceRepo: TeamInstanceRepository
  ) {
    this.#eventRepository = eventRepo
    this.#teamTemplateRepository = teamTemplateRepo
    this.#teamInstanceRepository = teamInstanceRepo
  }

  async listEvents() {
    const events = await this.#eventRepository.findAllEvents()
    return events
  }

  async getEvent(id: string) {
    const event = await this.#eventRepository.findEvent(id)

    if (!event) {
      throw new AppError('Event not found')
    }

    return event
  }

  async createEvent(input: { name: string; description: string }) {
    const createdEvent = await this.#eventRepository.insertEvent(input)
    await this.#createEventTeams(createdEvent.id)

    return createdEvent
  }

  async updateEvent(id: string, input: { name?: string; description?: string }) {
    const eventToUpdate = await this.#eventRepository.findEvent(id)
    if (!eventToUpdate) {
      throw new AppError('Event not found, please check the event id.')
    }

    const updatedEvent = await this.#eventRepository.updateEvent(id, input)
    return updatedEvent
  }

  async deleteEvent(id: string) {
    const deletedEvent = await this.#eventRepository.deleteEvent(id)
    return deletedEvent
  }

  async #createEventTeams(eventId: string) {
    const teamTemplates = await this.#teamTemplateRepository.listTeamTemplates()
    const templateIds = teamTemplates.map((template) => template.id)
    const teamInstances = await this.#teamInstanceRepository.bulkInsertTeamInstances(
      eventId,
      templateIds
    )

    return teamInstances
  }
}
