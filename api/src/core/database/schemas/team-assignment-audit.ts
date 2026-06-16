import { pgEnum, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { users } from './users.ts'
import { subscriptions } from './subscriptions.ts'
import { teamInstances } from './team-instances.ts'

export const teamAssignmentAuditAction = pgEnum('team_assignment_audit_action', [
  'assign',
  'unassign',
  'move',
  'cancel',
])

export const teamAssignmentAudit = pgTable('team_assignment_audit', {
  id: uuid('id').defaultRandom().primaryKey(),
  subscriptionId: uuid('subscription_id')
    .references(() => subscriptions.id)
    .notNull(),
  teamInstanceId: uuid('team_instance_id').references(() => teamInstances.id),
  action: teamAssignmentAuditAction().notNull(),
  actorId: uuid('actor_id')
    .references(() => users.id)
    .notNull(),
  at: timestamp('at').notNull().defaultNow(),
})
