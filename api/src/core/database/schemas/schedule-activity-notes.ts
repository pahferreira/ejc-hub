import {
  pgTable,
  uuid,
  text,
  timestamp,
  foreignKey,
  check,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { events } from './events.ts'
import { users } from './users.ts'
import { scheduleActivities } from './schedule-activities.ts'
import { teamInstances } from './team-instances.ts'

// The role a note was written in. It decides who reads the note.
export const scheduleNoteAuthorRole = pgEnum('schedule_note_author_role', ['admin', 'coordinator'])

// Observações: short notes admins and coordinators leave on an activity.
export const scheduleActivityNotes = pgTable(
  'schedule_activity_notes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    activityId: uuid('activity_id')
      .references(() => scheduleActivities.id, { onDelete: 'cascade' })
      .notNull(),
    eventId: uuid('event_id')
      .references(() => events.id)
      .notNull(),
    authorId: uuid('author_id')
      .references(() => users.id)
      .notNull(),
    authorRole: scheduleNoteAuthorRole().notNull(),
    // The coordinator's team when the note was written: a snapshot, so a later
    // team change doesn't move the note. Null for an admin's note.
    teamInstanceId: uuid('team_instance_id'),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Only a team of the note's event: the same pattern as team_memberships.
    foreignKey({
      columns: [table.teamInstanceId, table.eventId],
      foreignColumns: [teamInstances.id, teamInstances.eventId],
      name: 'schedule_activity_notes_team_instance_event_fk',
    }),
    check(
      'schedule_activity_notes_body_length_check',
      sql`char_length(${table.body}) between 1 and 500`
    ),
    // A coordinator's note carries their team; an admin's never does.
    check(
      'schedule_activity_notes_team_matches_role_check',
      sql`(${table.authorRole} = 'coordinator') = (${table.teamInstanceId} is not null)`
    ),
    index('schedule_activity_notes_event_id_created_at_idx').on(table.eventId, table.createdAt),
  ]
)
