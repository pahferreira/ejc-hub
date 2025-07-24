import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core'
import { subscriptions } from './subscriptions.ts'
import { teamInstances } from './team-instances.ts'

export const subscriptionOptions = pgTable('subscription_options', {
  id: uuid('id').primaryKey().defaultRandom(),
  subscriptionId: uuid('subscription_id').references(() => subscriptions.id),
  teamInstanceId: uuid('team_instance_id').references(() => teamInstances.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
