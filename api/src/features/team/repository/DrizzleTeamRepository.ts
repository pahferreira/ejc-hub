import { eq } from 'drizzle-orm'
import { db } from '../../../core/database/client.ts'
import { schema } from '../../../core/database/schemas/index.ts'
import type { TeamRepository } from '../domain/TeamRepository.ts'

class DrizzleTeamRepository implements TeamRepository {
  async insertTeamTemplate(input: { description?: string | null; key: string; name: string }) {
    const { description, key, name } = input

    const result = await db
      .insert(schema.teamTemplates)
      .values({
        description,
        key,
        name,
      })
      .returning()

    return result[0].id ?? ''
  }

  async selectTeamTemplateByKey(key: string) {
    const result = await db
      .selectDistinct()
      .from(schema.teamTemplates)
      .where(eq(schema.teamTemplates.key, key))

    if (result[0]) {
      return result[0]
    }

    return undefined
  }

  async selectTeamTemplateById(id: string) {
    const result = await db
      .selectDistinct()
      .from(schema.teamTemplates)
      .where(eq(schema.teamTemplates.id, id))
      .limit(1)

    if (result[0]) {
      return result[0]
    }

    return undefined
  }

  async listTeamTemplates() {
    const results = await db
      .selectDistinct()
      .from(schema.teamTemplates)
      .orderBy(schema.teamTemplates.name)

    return results
  }

  async updateTeamTemplate(id: string, input: { description?: string | null; name?: string }) {
    const updatedTeamTemplate = await db
      .update(schema.teamTemplates)
      .set(input)
      .where(eq(schema.teamTemplates.id, id))
      .returning()

    return updatedTeamTemplate[0]
  }

  async deleteTeamTemplate(id: string) {
    const deleted = await db
      .delete(schema.teamTemplates)
      .where(eq(schema.teamTemplates.id, id))
      .returning()

    return deleted[0]
  }

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
}

export const teamRepository = new DrizzleTeamRepository()
