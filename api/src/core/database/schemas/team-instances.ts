import { pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import { teamTemplates } from './team-templates.ts'
import { events } from './events.ts'

export const teamInstances = pgTable(
  'team_instances',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    templateId: uuid('template_id')
      .references(() => teamTemplates.id)
      .notNull(),
    eventId: uuid('event_id')
      .references(() => events.id)
      .notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    // Redundant against the primary key on its own, but Postgres requires the
    // referenced columns to be unique — this is the target of the composite FK
    // from team_memberships.
    unique('team_instances_id_event_id_unique').on(table.id, table.eventId),
  ]
)
