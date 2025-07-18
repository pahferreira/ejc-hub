import { eq } from 'drizzle-orm'
import { db } from '../../../core/database/client.ts'
import { schema } from '../../../core/database/schemas/index.ts'
import type { TeamInstanceRepository } from '../domain/TeamInstanceRepository.ts'

class DrizzleTeamInstanceRepository implements TeamInstanceRepository {
  async insertTeamInstance(input: { templateId: string; eventId: string }) {
    const result = await db
      .insert(schema.teamInstances)
      .values({
        templateId: input.templateId,
        eventId: input.eventId,
      })
      .returning()

    return result[0]
  }

  async listTeamInstances(eventId?: string) {
    const results = await db
      .selectDistinct({
        id: schema.teamInstances.id,
        eventId: schema.teamInstances.eventId,
        name: schema.teamTemplates.name,
        templateKey: schema.teamTemplates.key,
      })
      .from(schema.teamInstances)
      .where(eventId ? eq(schema.teamInstances.id, eventId) : undefined)
      .innerJoin(schema.teamTemplates, eq(schema.teamInstances.templateId, schema.teamTemplates.id))

    return results
  }

  async selectTeamInstance(id: string) {
    const result = await db
      .select({
        id: schema.teamInstances.id,
        description: schema.teamTemplates.description,
        eventId: schema.teamInstances.eventId,
        name: schema.teamTemplates.name,
        templateKey: schema.teamTemplates.key,
      })
      .from(schema.teamInstances)
      .where(eq(schema.teamInstances.id, id))
      .innerJoin(schema.teamTemplates, eq(schema.teamInstances.templateId, schema.teamTemplates.id))

    return result[0]
  }

  async deleteTeamInstance(id: string) {
    const deleted = await db
      .delete(schema.teamInstances)
      .where(eq(schema.teamInstances.id, id))
      .returning()

    return deleted[0]
  }

  async updateTeamInstance(
    id: string,
    input: { firstCoordinatorId?: string | null; secondCoordinatorId?: string | null }
  ) {
    const updated = await db
      .update(schema.teamInstances)
      .set(input)
      .where(eq(schema.teamInstances.id, id))
      .returning()

    return updated[0]
  }
}

export const teamInstanceRepository = new DrizzleTeamInstanceRepository()
