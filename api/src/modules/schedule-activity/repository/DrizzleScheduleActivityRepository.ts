import { and, asc, eq } from 'drizzle-orm'
import { db, type DbExecutor } from '../../../core/database/client.ts'
import { schema } from '../../../core/database/schemas/index.ts'
import type {
  InsertScheduleActivityInput,
  ScheduleActivityRepository,
} from '../domain/ScheduleActivityRepository.ts'

class DrizzleScheduleActivityRepository implements ScheduleActivityRepository {
  async listActivitiesByEvent(eventId: string) {
    return db
      .select()
      .from(schema.scheduleActivities)
      .where(eq(schema.scheduleActivities.eventId, eventId))
      .orderBy(asc(schema.scheduleActivities.plannedStartsAt))
  }

  async insertActivity(input: InsertScheduleActivityInput, executor: DbExecutor = db) {
    const rows = await executor
      .insert(schema.scheduleActivities)
      .values({
        dayId: input.dayId,
        eventId: input.eventId,
        title: input.title,
        plannedStartsAt: input.plannedStartsAt,
        durationMinutes: input.durationMinutes,
        place: input.place,
        guestName: input.guestName,
        adminsResponsible: input.adminsResponsible,
      })
      .returning()

    return rows[0]
  }

  async findActivityById(id: string, eventId: string) {
    const rows = await db
      .select()
      .from(schema.scheduleActivities)
      .where(
        and(eq(schema.scheduleActivities.id, id), eq(schema.scheduleActivities.eventId, eventId))
      )

    return rows[0]
  }

  async updateActivity(id: string, input: InsertScheduleActivityInput, executor: DbExecutor = db) {
    const rows = await executor
      .update(schema.scheduleActivities)
      .set({
        dayId: input.dayId,
        title: input.title,
        plannedStartsAt: input.plannedStartsAt,
        durationMinutes: input.durationMinutes,
        place: input.place,
        guestName: input.guestName,
        adminsResponsible: input.adminsResponsible,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.scheduleActivities.id, id),
          eq(schema.scheduleActivities.eventId, input.eventId)
        )
      )
      .returning()

    return rows[0]
  }

  async deleteActivity(id: string, eventId: string) {
    const rows = await db
      .delete(schema.scheduleActivities)
      .where(
        and(eq(schema.scheduleActivities.id, id), eq(schema.scheduleActivities.eventId, eventId))
      )
      .returning()

    return rows[0]
  }
}

export const scheduleActivityRepository = new DrizzleScheduleActivityRepository()
