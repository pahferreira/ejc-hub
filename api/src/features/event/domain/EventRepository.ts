import type { EventInput, EventModel } from '../../../core/database/schemas/index.ts'

export interface EventRepository {
  insertEvent: (input: EventInput) => Promise<EventModel>
  findEvent: (id: string) => Promise<EventInput | undefined>
  findAllEvents: () => Promise<EventModel[]>
  softDeleteEvent: (id: string) => Promise<EventModel>
  updateEvent: (id: string, input: Partial<EventInput>) => Promise<EventModel>
  bulkUpdateEvents: (id: string, input: Partial<EventInput>) => Promise<EventModel[]>
  findCurrentEvent: () => Promise<EventModel | undefined>
}
