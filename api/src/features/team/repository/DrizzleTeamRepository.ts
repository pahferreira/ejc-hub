import { eq } from 'drizzle-orm'
import { db } from '../../../core/database/client.ts'
import { schema } from '../../../core/database/schemas/index.ts'
import type { TeamRepository } from '../domain/TeamRepository.ts'

class DrizzleTeamRepository implements TeamRepository {
  async insertTeamTemplate(input: {
    description?: string | null
    key: string
    name: string
  }) {
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

  async getTeamTemplateByKey(key: string) {
    const result = await db
      .selectDistinct()
      .from(schema.teamTemplates)
      .where(eq(schema.teamTemplates.key, key))

    if (result[0]) {
      return result[0]
    }

    return undefined
  }

  async getTeamTemplateById(id: string) {
    const result = await db
      .selectDistinct()
      .from(schema.teamTemplates)
      .where(eq(schema.teamTemplates.id, id))

    if (result[0]) {
      return result[0]
    }

    return undefined
  }
}

export const teamRepository = new DrizzleTeamRepository()
