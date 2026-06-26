import { and, eq, sql } from 'drizzle-orm'
import { db, type DbExecutor } from '../../../core/database/client.ts'
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

  async updateSubscriptionStatus(
    id: string,
    status: SubscriptionStatus,
    executor: DbExecutor = db
  ) {
    const result = await executor
      .update(schema.subscriptions)
      .set({ status, updatedAt: new Date() })
      .where(eq(schema.subscriptions.id, id))
      .returning()

    return result[0]
  }

  async countSubscriptionsByStatusForEvent(
    eventId: string
  ): Promise<Record<SubscriptionStatus, number>> {
    const results = await db
      .select({
        status: schema.subscriptions.status,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.eventId, eventId))
      .groupBy(schema.subscriptions.status)

    const counts: Record<SubscriptionStatus, number> = {
      pending: 0,
      received: 0,
      completed: 0,
      waiting_list: 0,
      cancelled: 0,
    }

    for (const row of results) {
      counts[row.status] = row.count
    }

    return counts
  }

  async listSubscriptionsByEventId(eventId: string) {
    const results = await db
      .select({
        id: schema.subscriptions.id,
        userId: schema.subscriptions.userId,
        status: schema.subscriptions.status,
        createdAt: schema.subscriptions.createdAt,
        teams: sql<string[]>`array_agg(${schema.subscriptionOptions.teamInstanceId})`,
        user: {
          name: schema.users.name,
          nickname: schema.users.nickname,
          email: schema.users.email,
          phone: schema.users.phone,
          experienceType: schema.users.experienceType,
          hasActingSkills: schema.users.hasActingSkills,
          hasCommunicationSkills: schema.users.hasCommunicationSkills,
          hasCookingSkills: schema.users.hasCookingSkills,
          hasDancingSkills: schema.users.hasDancingSkills,
          hasManualSkills: schema.users.hasManualSkills,
          hasMusicSkills: schema.users.hasMusicSkills,
          hasSingingSkills: schema.users.hasSingingSkills,
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
        schema.subscriptions.userId,
        schema.subscriptions.createdAt,
        schema.users.name,
        schema.users.nickname,
        schema.users.email,
        schema.users.phone,
        schema.users.experienceType,
        schema.users.hasActingSkills,
        schema.users.hasCommunicationSkills,
        schema.users.hasCookingSkills,
        schema.users.hasDancingSkills,
        schema.users.hasManualSkills,
        schema.users.hasMusicSkills,
        schema.users.hasSingingSkills
      )
      .where(eq(schema.subscriptions.eventId, eventId))
    return results
  }
}

export const subscriptionRepository = new DrizzleSubscriptionRepository()
