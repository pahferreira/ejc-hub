import { pgTable, pgEnum, uuid, text, unique, check } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './users.ts'
import { meetings } from './meetings.ts'

export const meetingAttendanceStatus = pgEnum('meeting_attendance_status', [
  'present',
  'absent',
  'justified',
])

export const meetingAttendances = pgTable(
  'meeting_attendances',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    meetingId: uuid('meeting_id')
      .references(() => meetings.id, { onDelete: 'cascade' })
      .notNull(),
    // Points at users, deliberately not team_memberships: removing a membership
    // is a hard delete, and attendance history must outlive it (ADR 5).
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    status: meetingAttendanceStatus().notNull(),
    justificationReason: text('justification_reason'),
  },
  (table) => [
    // One explicit row per roster member per meeting.
    unique('meeting_attendances_meeting_id_user_id_unique').on(table.meetingId, table.userId),
    // A reason exactly when justified: never a justified absence without one (a
    // whitespace-only one included), and never a stale reason left on a row
    // flipped back to present or absent. The coalesce matters: a regex match on
    // NULL is NULL, and a CHECK passes on NULL.
    check(
      'meeting_attendances_justification_reason_check',
      sql`(${table.status} = 'justified' AND coalesce(${table.justificationReason} ~ '[^[:space:]]', false)) OR (${table.status} <> 'justified' AND ${table.justificationReason} IS NULL)`
    ),
  ]
)
