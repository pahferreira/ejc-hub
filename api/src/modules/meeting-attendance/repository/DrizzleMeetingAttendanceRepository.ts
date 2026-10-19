import { and, asc, eq, inArray, sql, type SQL } from 'drizzle-orm'
import { db, type DbExecutor } from '../../../core/database/client.ts'
import { schema } from '../../../core/database/schemas/index.ts'
import type {
  InsertMeetingAttendanceInput,
  MeetingAttendanceRepository,
  UpdateMeetingAttendanceInput,
} from '../domain/MeetingAttendanceRepository.ts'

// The select every read shares, so the two list methods return the same row.
const attendanceColumns = {
  id: schema.meetingAttendances.id,
  meetingId: schema.meetingAttendances.meetingId,
  heldOn: schema.meetings.heldOn,
  userId: schema.meetingAttendances.userId,
  name: schema.users.name,
  nickname: schema.users.nickname,
  pictureUrl: schema.users.pictureUrl,
  status: schema.meetingAttendances.status,
  justificationReason: schema.meetingAttendances.justificationReason,
}

// `case user_id when $1 then $2 ... end`, so a batch of edits is one statement.
function caseByUser(
  updates: UpdateMeetingAttendanceInput[],
  valueOf: (update: UpdateMeetingAttendanceInput) => SQL
): SQL {
  const branches = updates.map((update) => sql`when ${update.userId}::uuid then ${valueOf(update)}`)

  return sql`case ${schema.meetingAttendances.userId} ${sql.join(branches, sql` `)} end`
}

class DrizzleMeetingAttendanceRepository implements MeetingAttendanceRepository {
  // Reads hardcode `db`; only writes take an executor.
  #selectAttendances() {
    return db
      .select(attendanceColumns)
      .from(schema.meetingAttendances)
      .innerJoin(schema.meetings, eq(schema.meetingAttendances.meetingId, schema.meetings.id))
      .innerJoin(schema.users, eq(schema.meetingAttendances.userId, schema.users.id))
  }

  async insertAttendances(inputs: InsertMeetingAttendanceInput[], executor: DbExecutor = db) {
    if (inputs.length === 0) {
      return []
    }

    const rows = await executor
      .insert(schema.meetingAttendances)
      .values(
        inputs.map((input) => ({
          meetingId: input.meetingId,
          userId: input.userId,
          status: input.status,
          justificationReason: input.justificationReason ?? null,
        }))
      )
      .returning({ id: schema.meetingAttendances.id })

    return rows.map((row) => row.id)
  }

  async listAttendancesByMeeting(meetingId: string) {
    return this.#selectAttendances()
      .where(eq(schema.meetingAttendances.meetingId, meetingId))
      .orderBy(asc(schema.users.name), asc(schema.meetingAttendances.id))
  }

  async listAttendancesByTeamInstance(teamInstanceId: string) {
    return this.#selectAttendances()
      .where(eq(schema.meetings.teamInstanceId, teamInstanceId))
      .orderBy(asc(schema.meetings.heldOn), asc(schema.meetings.id), asc(schema.users.name))
  }

  async updateAttendanceStatuses(
    meetingId: string,
    updates: UpdateMeetingAttendanceInput[],
    executor: DbExecutor = db
  ) {
    if (updates.length === 0) {
      return []
    }

    const rows = await executor
      .update(schema.meetingAttendances)
      .set({
        status: caseByUser(updates, (update) => sql`${update.status}::meeting_attendance_status`),
        justificationReason: caseByUser(
          updates,
          (update) => sql`${update.justificationReason ?? null}::text`
        ),
      })
      .where(
        and(
          eq(schema.meetingAttendances.meetingId, meetingId),
          inArray(
            schema.meetingAttendances.userId,
            updates.map((update) => update.userId)
          )
        )
      )
      .returning({ userId: schema.meetingAttendances.userId })

    return rows.map((row) => row.userId)
  }
}

export const meetingAttendanceRepository = new DrizzleMeetingAttendanceRepository()
