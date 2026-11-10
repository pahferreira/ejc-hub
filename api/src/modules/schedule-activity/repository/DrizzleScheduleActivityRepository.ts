import { and, asc, eq } from 'drizzle-orm'
import { db, type DbExecutor } from '../../../core/database/client.ts'
import { schema } from '../../../core/database/schemas/index.ts'
import type {
  InsertScheduleActivityInput,
  ScheduleActivityRepository,
  UpdatePlannedStartInput,
} from '../domain/ScheduleActivityRepository.ts'

// One activity, only when it belongs to the event.
function byIdInEvent(id: string, eventId: string) {
  return and(eq(schema.scheduleActivities.id, id), eq(schema.scheduleActivities.eventId, eventId))
}

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
    const rows = await db.select().from(schema.scheduleActivities).where(byIdInEvent(id, eventId))

    return rows[0]
  }

  async updateActivity(
    id: string,
    eventId: string,
    input: Omit<InsertScheduleActivityInput, 'eventId'>,
    executor: DbExecutor = db
  ) {
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
      .where(byIdInEvent(id, eventId))
      .returning()

    return rows[0]
  }

  async deleteActivity(id: string, eventId: string) {
    const rows = await db
      .delete(schema.scheduleActivities)
      .where(byIdInEvent(id, eventId))
      .returning()

    return rows[0]
  }

  async updatePlannedStarts(
    eventId: string,
    updates: UpdatePlannedStartInput[],
    executor: DbExecutor = db
  ) {
    // One statement per activity: a day holds a handful, and the caller's
    // transaction keeps them all-or-nothing.
    for (const update of updates) {
      await executor
        .update(schema.scheduleActivities)
        .set({ plannedStartsAt: update.plannedStartsAt, updatedAt: new Date() })
        .where(byIdInEvent(update.id, eventId))
    }
  }
}

export const scheduleActivityRepository = new DrizzleScheduleActivityRepository()
