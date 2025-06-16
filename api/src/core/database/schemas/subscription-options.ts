import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { subscriptions } from './subscriptions.ts'
import { teamInstances } from './team-instances.ts'

export const subscriptionOptions = pgTable('subscription_options', {
  id: text('id').primaryKey(),
  subscriptionId: text('subscription_id').references(() => subscriptions.id),
  teamInstanceId: text('team_instance_id').references(() => teamInstances.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
