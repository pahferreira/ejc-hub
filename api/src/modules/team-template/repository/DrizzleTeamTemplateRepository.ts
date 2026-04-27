import { eq } from 'drizzle-orm'
import { db } from '../../../core/database/client.ts'
import { schema } from '../../../core/database/schemas/index.ts'
import type { TeamTemplateRepository } from '../domain/TeamTemplateRepository.ts'

class DrizzleTeamTemplateRepository implements TeamTemplateRepository {
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

    return result[0]
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
}

export const teamTemplateRepository = new DrizzleTeamTemplateRepository()
