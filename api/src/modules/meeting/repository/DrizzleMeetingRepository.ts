import { desc, eq, sql } from 'drizzle-orm'
import { db, type DbExecutor } from '../../../core/database/client.ts'
import { schema } from '../../../core/database/schemas/index.ts'
import type {
  InsertMeetingInput,
  MeetingRepository,
  UpdateMeetingInput,
} from '../domain/MeetingRepository.ts'

class DrizzleMeetingRepository implements MeetingRepository {
  async insertMeeting(input: InsertMeetingInput, executor: DbExecutor = db) {
    const rows = await executor
      .insert(schema.meetings)
      .values({
        teamInstanceId: input.teamInstanceId,
        heldOn: input.heldOn,
        title: input.title ?? null,
        description: input.description ?? null,
        createdBy: input.createdBy,
      })
      .returning()

    return rows[0]
  }

  async getMeeting(id: string) {
    const rows = await db.select().from(schema.meetings).where(eq(schema.meetings.id, id))

    return rows[0]
  }

  async listMeetingsByTeamInstance(teamInstanceId: string) {
    return db
      .select()
      .from(schema.meetings)
      .where(eq(schema.meetings.teamInstanceId, teamInstanceId))
      .orderBy(
        desc(schema.meetings.heldOn),
        desc(schema.meetings.createdAt),
        desc(schema.meetings.id)
      )
  }

  async updateMeeting(id: string, input: UpdateMeetingInput, executor: DbExecutor = db) {
    const rows = await executor
      .update(schema.meetings)
      .set({
        heldOn: input.heldOn,
        title: input.title ?? null,
        description: input.description ?? null,
        // The database's clock, not Node's: `created_at` was stamped by the
        // column default, and "editada" compares the two.
        updatedAt: sql`now()`,
      })
      .where(eq(schema.meetings.id, id))
      .returning()

    return rows[0]
  }

  async deleteMeeting(id: string, executor: DbExecutor = db) {
    const rows = await executor
      .delete(schema.meetings)
      .where(eq(schema.meetings.id, id))
      .returning()

    return rows[0]
  }
}

export const meetingRepository = new DrizzleMeetingRepository()
