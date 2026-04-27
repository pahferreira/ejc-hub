import { eq } from 'drizzle-orm'
import { db } from '../../../core/database/client.ts'
import { schema } from '../../../core/database/schemas/index.ts'
import type { UserRepository } from '../domain/UserRepository.ts'

type UpdateUserInput = {
  phone?: string | null
  nickname?: string | null
  dateOfBirth?: Date | null
  hasMusicSkills?: boolean
  hasActingSkills?: boolean
  hasDancingSkills?: boolean
  hasSingingSkills?: boolean
  hasManualSkills?: boolean
  hasCookingSkills?: boolean
  hasCommunicationSkills?: boolean
}

class DrizzleUserRepository implements UserRepository {
  async createUser(input: { email: string; name: string; authId: string; picture?: string }) {
    const results = await db.insert(schema.users).values(input).returning()
    return results[0]
  }

  async getUser(authId: string) {
    const results = await db.select().from(schema.users).where(eq(schema.users.authId, authId))
    return results[0]
  }

  async updateUser(id: string, input: UpdateUserInput) {
    const results = await db
      .update(schema.users)
      .set(input)
      .where(eq(schema.users.id, id))
      .returning()

    return results[0]
  }
}

export const userRepository = new DrizzleUserRepository()
