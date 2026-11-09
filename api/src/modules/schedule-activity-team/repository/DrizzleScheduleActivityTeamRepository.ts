import { eq } from 'drizzle-orm'
import { db, type DbExecutor } from '../../../core/database/client.ts'
import { schema } from '../../../core/database/schemas/index.ts'
import type { ScheduleActivityTeamRepository } from '../domain/ScheduleActivityTeamRepository.ts'

class DrizzleScheduleActivityTeamRepository implements ScheduleActivityTeamRepository {
  async listTeamsByEvent(eventId: string) {
    return db
      .select({
        activityId: schema.scheduleActivityTeams.activityId,
        teamInstanceId: schema.scheduleActivityTeams.teamInstanceId,
        teamName: schema.teamTemplates.name,
        teamKey: schema.teamTemplates.key,
      })
      .from(schema.scheduleActivityTeams)
      .innerJoin(
        schema.teamInstances,
        eq(schema.scheduleActivityTeams.teamInstanceId, schema.teamInstances.id)
      )
      .innerJoin(schema.teamTemplates, eq(schema.teamInstances.templateId, schema.teamTemplates.id))
      .where(eq(schema.scheduleActivityTeams.eventId, eventId))
  }

  async insertTeams(
    activityId: string,
    teamInstanceIds: string[],
    eventId: string,
    executor: DbExecutor = db
  ) {
    if (teamInstanceIds.length === 0) {
      return
    }

    await executor.insert(schema.scheduleActivityTeams).values(
      teamInstanceIds.map((teamInstanceId) => ({
        activityId,
        teamInstanceId,
        eventId,
      }))
    )
  }
}

export const scheduleActivityTeamRepository = new DrizzleScheduleActivityTeamRepository()
