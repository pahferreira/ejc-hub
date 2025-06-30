import type { EventRepository } from '../domain/EventRepository.ts'
import { z } from 'zod/v4'
import { AppError } from '../../../shared/AppError.ts'

const eventInputSchema = z.object({
  name: z.string('event name is required'),
  description: z.string('event description is required'),
})

const partialEventInputSchema = eventInputSchema.partial().refine((data) => {
  return data.name || data.description
})

type EventInput = z.infer<typeof eventInputSchema>
type PartialEventInput = z.infer<typeof partialEventInputSchema>

export class Events {
  #eventRepository: EventRepository

  constructor(repository: EventRepository) {
    this.#eventRepository = repository
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

  async createEvent(input: EventInput) {
    const validatedInput = eventInputSchema.safeParse(input)

    if (!validatedInput.success) {
      throw new AppError(validatedInput.error.message)
    }

    const createdEvent = await this.#eventRepository.insertEvent(input)
    return createdEvent
  }

  async updateEvent(id: string, input: PartialEventInput) {
    const validatedInput = partialEventInputSchema.safeParse(input)

    if (!validatedInput.success) {
      throw new AppError(
        'At least one of the following attributes needs to be present: name, description'
      )
    }

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
}
