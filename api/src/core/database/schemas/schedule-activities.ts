import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  foreignKey,
  check,
  index,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { scheduleDays } from './schedule-days.ts'

export const scheduleActivities = pgTable(
  'schedule_activities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    dayId: uuid('day_id').notNull(),
    // Denormalized from schedule_days so activity teams can be tied to the same
    // event. The composite FK below keeps it in step with the day.
    eventId: uuid('event_id').notNull(),
    title: text('title').notNull(),
    // The first timestamptz in the schema (ADR #9): an instant, entered and
    // shown in São Paulo time. The planned end is this plus the duration, never stored.
    plannedStartsAt: timestamp('planned_starts_at', { withTimezone: true }).notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    place: text('place').notNull(),
    guestName: text('guest_name'),
    adminsResponsible: boolean('admins_responsible').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    // Deleting a day takes its activities with it.
    foreignKey({
      columns: [table.dayId, table.eventId],
      foreignColumns: [scheduleDays.id, scheduleDays.eventId],
      name: 'schedule_activities_day_event_fk',
    }).onDelete('cascade'),
    check('schedule_activities_duration_minutes_check', sql`${table.durationMinutes} > 0`),
    index('schedule_activities_day_id_planned_starts_at_idx').on(
      table.dayId,
      table.plannedStartsAt
    ),
  ]
)
