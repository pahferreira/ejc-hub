import { pgTable, uuid, timestamp, pgEnum, unique, foreignKey } from 'drizzle-orm/pg-core'
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
    teamInstanceId: uuid('team_instance_id').notNull(),
    // Denormalized from team_instances so "one membership per user per event" can
    // be enforced by the database — a UNIQUE cannot span tables. The composite FK
    // below makes it impossible for this to disagree with the team instance.
    eventId: uuid('event_id').notNull(),
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
    // One membership per user per event, members and coordinators alike. Stops a
    // user being a member of one team while coordinating another.
    unique('team_memberships_event_id_user_id_unique').on(table.eventId, table.userId),
    // Ties event_id to the team instance's own event. Also replaces the plain FK
    // on team_instance_id, which this strictly implies.
    foreignKey({
      columns: [table.teamInstanceId, table.eventId],
      foreignColumns: [teamInstances.id, teamInstances.eventId],
      name: 'team_memberships_team_instance_event_fk',
    }),
  ]
)
