import { pgTable, uuid, timestamp, pgEnum, unique } from 'drizzle-orm/pg-core'
import { users } from './users.ts'
import { teamInstances } from './team-instances.ts'

export const teamMembershipType = pgEnum('team_membership_type', ['member', 'coordinator'])

export const teamMemberships = pgTable(
  'team_memberships',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    teamInstanceId: uuid('team_instance_id')
      .references(() => teamInstances.id)
      .notNull(),
    // Coordinators are a flat peer set (type='coordinator') — no rank or ordering
    // between them. The max-coordinators cap is enforced as an API business rule.
    type: teamMembershipType().notNull().default('member'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    // One row per user per team — prevents a duplicate coordinator and keeps a
    // user's member/coordinator rows disjoint for the same team.
    unique('team_memberships_team_instance_id_user_id_unique').on(
      table.teamInstanceId,
      table.userId
    ),
  ]
)
