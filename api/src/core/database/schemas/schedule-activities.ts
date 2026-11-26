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
  pgEnum,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { scheduleDays } from './schedule-days.ts'
import { users } from './users.ts'

// Where an activity stands while the event runs (Phase 2, Running Schedule).
export const scheduleActivityStatus = pgEnum('schedule_activity_status', [
  'planned',
  'running',
  'done',
  'skipped',
])

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
    // Every team of the event, as a live wildcard: such an activity has no
    // schedule_activity_teams rows, so a team added later is covered too.
    allTeams: boolean('all_teams').notNull().default(false),
    status: scheduleActivityStatus().notNull().default('planned'),
    // What really happened. Set when the activity starts and finishes.
    actualStartedAt: timestamp('actual_started_at', { withTimezone: true }),
    actualEndedAt: timestamp('actual_ended_at', { withTimezone: true }),
    // A trim (or stretch) set during the event. Replaces duration_minutes in the
    // forecast; the planned end keeps using duration_minutes.
    adjustedDurationMinutes: integer('adjusted_duration_minutes'),
    // The last admin to act on the activity's clock: the only audit trail.
    controlledBy: uuid('controlled_by').references(() => users.id),
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
    check(
      'schedule_activities_adjusted_duration_minutes_check',
      sql`${table.adjustedDurationMinutes} > 0`
    ),
    // One running activity per event. The core's expectedStatus check is what
    // users see; this is the safety net for two admins starting at once.
    uniqueIndex('schedule_activities_one_running_per_event_idx')
      .on(table.eventId)
      .where(sql`status = 'running'`),
    index('schedule_activities_day_id_planned_starts_at_idx').on(
      table.dayId,
      table.plannedStartsAt
    ),
  ]
)
