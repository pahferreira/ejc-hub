import { asc, eq } from 'drizzle-orm'
import { db } from '../../../core/database/client.ts'
import { schema } from '../../../core/database/schemas/index.ts'
import type {
  InsertScheduleActivityNoteInput,
  ScheduleActivityNoteRepository,
} from '../domain/ScheduleActivityNoteRepository.ts'

class DrizzleScheduleActivityNoteRepository implements ScheduleActivityNoteRepository {
  async listNotesByEvent(eventId: string) {
    return db
      .select({
        id: schema.scheduleActivityNotes.id,
        activityId: schema.scheduleActivityNotes.activityId,
        authorRole: schema.scheduleActivityNotes.authorRole,
        teamInstanceId: schema.scheduleActivityNotes.teamInstanceId,
        body: schema.scheduleActivityNotes.body,
        authorName: schema.users.name,
        authorNickname: schema.users.nickname,
        createdAt: schema.scheduleActivityNotes.createdAt,
      })
      .from(schema.scheduleActivityNotes)
      .innerJoin(schema.users, eq(schema.scheduleActivityNotes.authorId, schema.users.id))
      .where(eq(schema.scheduleActivityNotes.eventId, eventId))
      .orderBy(asc(schema.scheduleActivityNotes.createdAt), asc(schema.scheduleActivityNotes.id))
  }

  async insertNote(input: InsertScheduleActivityNoteInput) {
    const rows = await db
      .insert(schema.scheduleActivityNotes)
      .values({
        activityId: input.activityId,
        eventId: input.eventId,
        authorId: input.authorId,
        authorRole: input.authorRole,
        teamInstanceId: input.teamInstanceId,
        body: input.body,
      })
      .returning()

    return rows[0]
  }
}

export const scheduleActivityNoteRepository = new DrizzleScheduleActivityNoteRepository()
