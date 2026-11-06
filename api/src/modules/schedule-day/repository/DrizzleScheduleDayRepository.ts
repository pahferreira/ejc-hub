import { and, asc, count, eq, getTableColumns } from 'drizzle-orm'
import { db, type DbExecutor } from '../../../core/database/client.ts'
import { schema } from '../../../core/database/schemas/index.ts'
import type {
  InsertScheduleDayInput,
  ScheduleDayRepository,
} from '../domain/ScheduleDayRepository.ts'

class DrizzleScheduleDayRepository implements ScheduleDayRepository {
  async listDaysByEvent(eventId: string) {
    return db
      .select({
        ...getTableColumns(schema.scheduleDays),
        activityCount: count(schema.scheduleActivities.id),
      })
      .from(schema.scheduleDays)
      .leftJoin(
        schema.scheduleActivities,
        eq(schema.scheduleActivities.dayId, schema.scheduleDays.id)
      )
      .where(eq(schema.scheduleDays.eventId, eventId))
      .groupBy(schema.scheduleDays.id)
      .orderBy(asc(schema.scheduleDays.date))
  }

  async findDayByDate(eventId: string, date: string) {
    const rows = await db
      .select()
      .from(schema.scheduleDays)
      .where(and(eq(schema.scheduleDays.eventId, eventId), eq(schema.scheduleDays.date, date)))

    return rows[0]
  }

  async insertDay(input: InsertScheduleDayInput, executor: DbExecutor = db) {
    const rows = await executor
      .insert(schema.scheduleDays)
      .values({ eventId: input.eventId, date: input.date })
      .returning()

    return rows[0]
  }

  async deleteDay(id: string, eventId: string, executor: DbExecutor = db) {
    const rows = await executor
      .delete(schema.scheduleDays)
      .where(and(eq(schema.scheduleDays.id, id), eq(schema.scheduleDays.eventId, eventId)))
      .returning()

    return rows[0]
  }
}

export const scheduleDayRepository = new DrizzleScheduleDayRepository()
