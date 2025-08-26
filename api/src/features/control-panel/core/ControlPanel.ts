import { AppError } from '../../../shared/AppError.ts'
import type { EventRepository } from '../../event/domain/EventRepository.ts'
import type { TeamInstanceRepository } from '../../team/domain/TeamInstanceRepository.ts'
import type { TeamTemplateRepository } from '../../team/domain/TeamTemplateRepository.ts'

export class ControlPanel {
  #teamTemplateRepository: TeamTemplateRepository
  #eventRepository: EventRepository
  #teamInstanceRepository: TeamInstanceRepository

  constructor(
    teamTemplateRepo: TeamTemplateRepository,
    eventRepo: EventRepository,
    teamInstanceRepo: TeamInstanceRepository
  ) {
    this.#teamTemplateRepository = teamTemplateRepo
    this.#eventRepository = eventRepo
    this.#teamInstanceRepository = teamInstanceRepo
  }

  async createTeamTemplate(input: { description?: string; key: string; name: string }) {
    const teamTemplate = await this.#teamTemplateRepository.selectTeamTemplateByKey(input.key)

    if (teamTemplate) {
      throw new AppError('Team template key already in use.')
    }

    const result = await this.#teamTemplateRepository.insertTeamTemplate(input)

    if (!result) {
      throw new AppError('Failed to create team template.')
    }

    return result
  }

  async getTeamTemplateById(id: string) {
    const teamTemplate = await this.#teamTemplateRepository.selectTeamTemplateById(id)

    if (!teamTemplate) {
      throw new AppError('Team template not found, please check the team template id.')
    }

    return teamTemplate
  }

  async listTeamTemplates() {
    const teamTemplates = await this.#teamTemplateRepository.listTeamTemplates()
    return teamTemplates
  }

  async updateTeamTemplate(id: string, input: { description?: string; name?: string }) {
    const teamTemplateToUpdate = await this.#teamTemplateRepository.selectTeamTemplateById(id)

    if (!teamTemplateToUpdate) {
      throw new AppError('Team template not found, please check the team template id.')
    }

    const updatedTeamTemplate = await this.#teamTemplateRepository.updateTeamTemplate(id, input)
    return updatedTeamTemplate
  }

  async deleteTeamTemplate(id: string) {
    const deleted = await this.#teamTemplateRepository.deleteTeamTemplate(id)
    return deleted
  }

  async listEvents() {
    const events = await this.#eventRepository.findAllEvents()
    return events
  }

  async getEvent(eventId: string) {
    const event = await this.#eventRepository.findEvent(eventId)

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

  async #createEventTeams(eventId: string) {
    const teamTemplates = await this.#teamTemplateRepository.listTeamTemplates()
    const templateIds = teamTemplates.map((template) => template.id)
    const teamInstances = await this.#teamInstanceRepository.bulkInsertTeamInstances(
      eventId,
      templateIds
    )

    return teamInstances
  }

  async updateEvent(eventId: string, input: { name?: string; description?: string }) {
    const eventToUpdate = await this.#eventRepository.findEvent(eventId)
    if (!eventToUpdate) {
      throw new AppError('Event not found, please check the event id.')
    }

    const updatedEvent = await this.#eventRepository.updateEvent(eventId, input)
    return updatedEvent
  }

  async deleteEvent(eventId: string) {
    const deletedEvent = await this.#eventRepository.softDeleteEvent(eventId)
    return deletedEvent
  }

  async setCurrentEvent(eventId: string) {
    const eventToUpdate = await this.#eventRepository.findEvent(eventId)
    if (!eventToUpdate) {
      throw new AppError('Event not found, please check the event id.')
    }

    const updatedEvent = this.#eventRepository.updateEvent(eventId, {
      isCurrent: true,
    })

    await this.#eventRepository.bulkUpdateEvents(eventId, {
      isCurrent: false,
    })

    return updatedEvent
  }
}
