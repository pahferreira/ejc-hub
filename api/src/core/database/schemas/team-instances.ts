import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { teamTemplates } from './team-templates.ts'
import { users } from './users.ts'
import { events } from './events.ts'

export const teamInstances = pgTable('team_instances', {
  id: text('id').primaryKey(),
  templateId: uuid('template_id').references(() => teamTemplates.id),
  eventId: text('event_id').references(() => events.id),
  firstCoordinatorId: text('first_coordinator_id').references(() => users.id),
  secondCoordinatorId: text('second_coordinator_id').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
