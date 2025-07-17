import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users.ts'
import { teamInstances } from './team-instances.ts'

export const teamMemberships = pgTable('team_memberships', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  teamInstanceId: uuid('team_instance_id')
    .references(() => teamInstances.id)
    .notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
