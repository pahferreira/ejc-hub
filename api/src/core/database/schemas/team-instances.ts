import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { teamTemplates } from './team-templates.ts'
import { events } from './events.ts'

export const teamInstances = pgTable('team_instances', {
  id: uuid('id').defaultRandom().primaryKey(),
  templateId: uuid('template_id')
    .references(() => teamTemplates.id)
    .notNull(),
  eventId: uuid('event_id')
    .references(() => events.id)
    .notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
