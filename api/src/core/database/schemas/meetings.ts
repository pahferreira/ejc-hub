import { pgTable, uuid, text, date, timestamp, index, foreignKey } from 'drizzle-orm/pg-core'
import { users } from './users.ts'
import { teamInstances } from './team-instances.ts'

export const meetings = pgTable(
  'meetings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    teamInstanceId: uuid('team_instance_id').notNull(),
    // Denormalized from team_instances, in house style: the composite FK below
    // keeps it in step with the team's own event.
    eventId: uuid('event_id').notNull(),
    // A calendar day, not an instant: meetings are registered after the fact and
    // the rate compares this against the member's join day.
    heldOn: date('held_on', { mode: 'string' }).notNull(),
    title: text('title'),
    description: text('description'),
    createdBy: uuid('created_by')
      .references(() => users.id)
      .notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    // Later than created_at means the meeting was edited ("editada").
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.teamInstanceId, table.eventId],
      foreignColumns: [teamInstances.id, teamInstances.eventId],
      name: 'meetings_team_instance_event_fk',
    }),
    // No unique on (team_instance_id, held_on): two meetings on one day are allowed.
    index('meetings_team_instance_id_held_on_idx').on(table.teamInstanceId, table.heldOn),
  ]
)
