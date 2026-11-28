import type { DbExecutor } from '../../../core/database/client.ts'
import type { ScheduleActivityNoteModel } from '../../../core/database/schemas/index.ts'

/** The role a note was written in: it decides who reads the note. */
export type ScheduleNoteAuthorRole = ScheduleActivityNoteModel['authorRole']

export type InsertScheduleActivityNoteInput = {
  activityId: string
  eventId: string
  authorId: string
  authorRole: ScheduleNoteAuthorRole
  /** The coordinator's team at write time; null for an admin. */
  teamInstanceId: string | null
  body: string
}

/** One note with its author's name, as the read resolves who sees it. */
export type ScheduleActivityNoteRow = {
  id: string
  activityId: string
  authorRole: ScheduleNoteAuthorRole
  teamInstanceId: string | null
  body: string
  authorName: string
  authorNickname: string | null
  createdAt: Date
}

export interface ScheduleActivityNoteRepository {
  /** Every note of one event, oldest first, so they stack in creation order. */
  listNotesByEvent: (eventId: string) => Promise<ScheduleActivityNoteRow[]>

  insertNote: (
    input: InsertScheduleActivityNoteInput,
    executor?: DbExecutor
  ) => Promise<ScheduleActivityNoteModel>
}
