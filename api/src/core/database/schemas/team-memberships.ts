import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users.ts'
import { teamInstances } from './team-instances.ts'

export const teamMemberships = pgTable('team_memberships', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  teamInstanceId: text('team_instance_id').references(() => teamInstances.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
