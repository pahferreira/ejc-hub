import type { ScheduleNoteAuthorRole } from '../domain/schedule.types.ts'

/** Who is reading notes: an admin, or someone on a team in a team role. */
export type NoteReader =
  | { role: 'admin' }
  | { role: 'coordinator' | 'member'; teamInstanceId: string }

/** What decides a note's readers: its author's role and team at write time. */
export type NoteAudience = {
  authorRole: ScheduleNoteAuthorRole
  teamInstanceId: string | null
}

/** The activity's teams as they are now, not when the note was written. */
export type NoteActivityTeams = {
  allTeams: boolean
  teamInstanceIds: string[]
}

/**
 * Whether a reader sees a note:
 *
 * - admins read every note;
 * - a coordinator's note reaches the members and coordinators of the team it was
 *   written for;
 * - an admin's note reaches the coordinators of the activity's current teams
 *   (every team when it is all teams), and never a member.
 */
export function canReadNote(
  reader: NoteReader,
  note: NoteAudience,
  activity: NoteActivityTeams
): boolean {
  if (reader.role === 'admin') {
    return true
  }

  if (note.authorRole === 'coordinator') {
    return note.teamInstanceId === reader.teamInstanceId
  }

  if (reader.role !== 'coordinator') {
    return false
  }

  return activity.allTeams || activity.teamInstanceIds.includes(reader.teamInstanceId)
}
