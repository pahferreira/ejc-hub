import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  index,
  uniqueIndex,
  foreignKey,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './users.ts'
import { teamInstances } from './team-instances.ts'
import { subscriptions } from './subscriptions.ts'

export const memberRequestStatus = pgEnum('member_request_status', [
  'pending',
  'approved',
  'denied',
  'cancelled',
  'outdated',
])

export const memberRequests = pgTable(
  'member_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    teamInstanceId: uuid('team_instance_id').notNull(),
    eventId: uuid('event_id').notNull(),
    status: memberRequestStatus().notNull().default('pending'),
    requestedBy: uuid('requested_by')
      .references(() => users.id)
      .notNull(),
    message: text('message'),
    resolvedAt: timestamp('resolved_at'),
    resolvedBy: uuid('resolved_by').references(() => users.id),
    resolutionReason: text('resolution_reason'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.teamInstanceId, table.eventId],
      foreignColumns: [teamInstances.id, teamInstances.eventId],
      name: 'member_requests_team_instance_event_fk',
    }),
    foreignKey({
      columns: [table.userId, table.eventId],
      foreignColumns: [subscriptions.userId, subscriptions.eventId],
      name: 'member_requests_subscription_fk',
    }),
    // Partial so a denial is not permanent and two teams may ask for the same
    // person. Only the acceptance is exclusive, via team_memberships.
    uniqueIndex('member_requests_open_team_user_idx')
      .on(table.teamInstanceId, table.userId)
      .where(sql`status = 'pending'`),
    index('member_requests_team_instance_id_status_idx').on(table.teamInstanceId, table.status),
    index('member_requests_event_id_status_idx').on(table.eventId, table.status),
  ]
)
