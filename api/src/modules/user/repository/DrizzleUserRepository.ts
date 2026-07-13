import { asc, eq } from 'drizzle-orm'
import { db } from '../../../core/database/client.ts'
import { schema } from '../../../core/database/schemas/index.ts'
import type { UserInput } from '../../../core/database/schemas/index.ts'
import type { ListUsersOptions, UserRepository } from '../domain/UserRepository.ts'

class DrizzleUserRepository implements UserRepository {
  async createUser(input: UserInput) {
    const results = await db.insert(schema.users).values(input).returning()
    return results[0]
  }

  async getUser(authId: string) {
    const results = await db.select().from(schema.users).where(eq(schema.users.authId, authId))
    return results[0]
  }

  async listUsers({ limit, offset }: ListUsersOptions) {
    let query = db.select().from(schema.users).orderBy(asc(schema.users.name)).$dynamic()
    if (limit !== undefined) query = query.limit(limit)
    if (offset !== undefined) query = query.offset(offset)
    return query
  }

  async updateUser(id: string, input: Partial<UserInput>) {
    const results = await db
      .update(schema.users)
      .set(input)
      .where(eq(schema.users.id, id))
      .returning()

    return results[0]
  }
}

export const userRepository = new DrizzleUserRepository()
