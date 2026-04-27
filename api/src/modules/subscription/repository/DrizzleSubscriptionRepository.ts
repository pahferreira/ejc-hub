import { and, eq, sql } from 'drizzle-orm'
import { db } from '../../../core/database/client.ts'
import { schema } from '../../../core/database/schemas/index.ts'
import type { SubscriptionRepository } from '../domain/SubscriptionRepository.ts'
import type { SubscriptionStatus } from '../domain/subscription.types.ts'

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

  async updateSubscriptionStatus(id: string, status: SubscriptionStatus) {
    const result = await db
      .update(schema.subscriptions)
      .set({ status, updatedAt: new Date() })
      .where(eq(schema.subscriptions.id, id))
      .returning()

    return result[0]
  }

  async listSubscriptionsByEventId(eventId: string) {
    const results = await db
      .select({
        id: schema.subscriptions.id,
        status: schema.subscriptions.status,
        createdAt: schema.subscriptions.createdAt,
        teams: sql<string[]>`array_agg(${schema.subscriptionOptions.teamInstanceId})`,
        user: {
          name: schema.users.name,
          email: schema.users.email,
          phone: schema.users.phone,
        },
      })
      .from(schema.subscriptions)
      .innerJoin(schema.users, eq(schema.users.id, schema.subscriptions.userId))
      .leftJoin(
        schema.subscriptionOptions,
        eq(schema.subscriptionOptions.subscriptionId, schema.subscriptions.id)
      )
      .groupBy(
        schema.subscriptions.id,
        schema.subscriptions.createdAt,
        schema.users.name,
        schema.users.email,
        schema.users.phone
      )
      .where(eq(schema.subscriptions.eventId, eventId))
    return results
  }
}

export const subscriptionRepository = new DrizzleSubscriptionRepository()
