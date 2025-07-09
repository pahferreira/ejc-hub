import { eq } from 'drizzle-orm'
import { db } from '../../../core/database/client.ts'
import { schema } from '../../../core/database/schemas/index.ts'
import type { UserRepository } from '../domain/UserRepository.ts'

class DrizzleUserRepository implements UserRepository {
  async createUser(input: { email: string; name: string; authId: string; picture?: string }) {
    const results = await db.insert(schema.users).values(input).returning()
    return results[0]
  }

  async getUser(authId: string) {
    const results = await db.select().from(schema.users).where(eq(schema.users.authId, authId))
    return results[0]
  }
}

export const userRepository = new DrizzleUserRepository()
