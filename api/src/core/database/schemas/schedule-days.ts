import { pgTable, uuid, date, timestamp, unique } from 'drizzle-orm/pg-core'
import { events } from './events.ts'

export const scheduleDays = pgTable(
  'schedule_days',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id')
      .references(() => events.id)
      .notNull(),
    // A São Paulo calendar day, not an instant: the activities carry the instants.
    date: date('date', { mode: 'string' }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    // Each date is planned once per event.
    unique('schedule_days_event_id_date_unique').on(table.eventId, table.date),
    // Redundant against the primary key on its own, but Postgres requires the
    // referenced columns to be unique — this is the target of the composite FK
    // from schedule_activities.
    unique('schedule_days_id_event_id_unique').on(table.id, table.eventId),
  ]
)
