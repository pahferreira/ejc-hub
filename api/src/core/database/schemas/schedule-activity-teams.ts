import { pgTable, uuid, primaryKey, foreignKey } from 'drizzle-orm/pg-core'
import { scheduleActivities } from './schedule-activities.ts'
import { teamInstances } from './team-instances.ts'

export const scheduleActivityTeams = pgTable(
  'schedule_activity_teams',
  {
    activityId: uuid('activity_id')
      .references(() => scheduleActivities.id, { onDelete: 'cascade' })
      .notNull(),
    teamInstanceId: uuid('team_instance_id').notNull(),
    eventId: uuid('event_id').notNull(),
  },
  (table) => [
    primaryKey({
      name: 'schedule_activity_teams_pk',
      columns: [table.activityId, table.teamInstanceId],
    }),
    // Only a team of the activity's event can be responsible for it: the same
    // pattern as team_memberships.
    foreignKey({
      columns: [table.teamInstanceId, table.eventId],
      foreignColumns: [teamInstances.id, teamInstances.eventId],
      name: 'schedule_activity_teams_team_instance_event_fk',
    }),
  ]
)
