import { pgTable, text, uuid, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users.ts'
import { teamInstances } from './team-instances.ts'

export const teamMemberships = pgTable('team_memberships', {
  id: text('id').primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  teamInstanceId: uuid('team_instance_id').references(() => teamInstances.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
