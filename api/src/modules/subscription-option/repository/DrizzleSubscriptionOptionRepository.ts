import { eq } from 'drizzle-orm'
import { db } from '../../../core/database/client.ts'
import { schema } from '../../../core/database/schemas/index.ts'
import type { SubscriptionOptionRepository } from '../domain/SubscriptionOptionRepository.ts'

class DrizzleSubscriptionOptionRepository implements SubscriptionOptionRepository {
  async insertSubscriptionOptions(
    input: Array<{ subscriptionId: string; teamInstanceId: string }>
  ) {
    const results = await db.insert(schema.subscriptionOptions).values(input).returning()

    return results.length > 0 ? results : []
  }

  async deleteSubscriptionOption(id: string) {
    const result = await db
      .delete(schema.subscriptionOptions)
      .where(eq(schema.subscriptionOptions.id, id))
      .returning()

    return result[0]
  }

  async listTeamOptionsBySubscription(subscriptionId: string) {
    const results = await db
      .select({
        key: schema.teamTemplates.key,
        name: schema.teamTemplates.name,
      })
      .from(schema.subscriptionOptions)
      .innerJoin(
        schema.teamInstances,
        eq(schema.subscriptionOptions.teamInstanceId, schema.teamInstances.id)
      )
      .innerJoin(schema.teamTemplates, eq(schema.teamInstances.templateId, schema.teamTemplates.id))
      .where(eq(schema.subscriptionOptions.subscriptionId, subscriptionId))

    return results
  }
}

export const subscriptionOptionRepository = new DrizzleSubscriptionOptionRepository()
