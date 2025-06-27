import { eq } from 'drizzle-orm'
import { db } from '../../../core/database/client.ts'
import { schema } from '../../../core/database/schemas/index.ts'
import type { EventRepository } from '../domain/EventRepository.ts'

class DrizzleEventRepository implements EventRepository {
  async insertEvent(input: { name: string; description: string }) {
    const createdEvent = await db.insert(schema.events).values(input).returning()

    return createdEvent[0]
  }

  async findEvent(id: string) {
    const events = await db.select().from(schema.events).where(eq(schema.events.id, id)).limit(1)
    return events[0]
  }

  async findAllEvents() {
    const events = await db.select().from(schema.events)
    return events
  }

  async deleteEvent(id: string) {
    const deletedEvent = await db.delete(schema.events).where(eq(schema.events.id, id)).returning()
    return deletedEvent[0]
  }

  async updateEvent(id: string, input: { name?: string; description?: string }) {
    const updatedEvent = await db
      .update(schema.events)
      .set(input)
      .where(eq(schema.events.id, id))
      .returning()

    return updatedEvent[0]
  }
}

export const eventRepository = new DrizzleEventRepository()
