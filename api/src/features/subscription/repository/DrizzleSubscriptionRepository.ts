import { and, eq } from 'drizzle-orm'
import { db } from '../../../core/database/client.ts'
import { schema } from '../../../core/database/schemas/index.ts'
import type { SubscriptionRepository } from '../domain/SubscriptionRepository.ts'

class DrizzleSubscriptionRepository implements SubscriptionRepository {
  async insertSubscription(input: { userId: string; eventId: string }) {
    const result = await db.insert(schema.subscriptions).values(input).returning()
    return result[0]
  }

  async getSubscription(id: string) {
    const result = await db
      .select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.id, id))

    return result[0]
  }

  async listSubscriptions() {
    const results = await db.select().from(schema.subscriptions)
    return results
  }

  async getSubscriptionByUserAndEvent(userId: string, eventId: string) {
    const result = await db
      .select()
      .from(schema.subscriptions)
      .where(
        and(eq(schema.subscriptions.userId, userId), eq(schema.subscriptions.eventId, eventId))
      )

    return result[0]
  }
}

export const subscriptionRepository = new DrizzleSubscriptionRepository()
