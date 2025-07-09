import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { teamTemplates } from './team-templates.ts'
import { users } from './users.ts'
import { events } from './events.ts'

export const teamInstances = pgTable('team_instances', {
  id: uuid('id').defaultRandom().primaryKey(),
  templateId: uuid('template_id')
    .references(() => teamTemplates.id)
    .notNull(),
  eventId: uuid('event_id')
    .references(() => events.id)
    .notNull(),
  firstCoordinatorId: uuid('first_coordinator_id').references(() => users.id),
  // secondCoordinatorId: uuid('second_coordinator_id').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
